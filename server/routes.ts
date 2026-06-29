import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { uploadImage, uploadAudio, deleteFromCloudinary, getPublicIdFromUrl } from "./cloudinary";
import { storage } from "./storage";
import {
  insertUserSchema, insertWeddingSchema, insertGuestSchema,
  insertPhotoSchema, insertGuestBookEntrySchema, rsvpUpdateSchema,
  insertInvitationSchema, insertGuestCollaboratorSchema, insertWeddingAccessSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import paymentsRouter from './payments';

// Payment helper functions for Click and Payme
function generatePaymeUrl(orderId: string, amount: number): string {
  const merchantId = process.env.PAYME_MERCHANT_ID || 'test_merchant';
  const baseUrl = 'https://checkout.paycom.uz';
  const params = new URLSearchParams({
    'm': merchantId,
    'ac.order_id': orderId,
    'a': amount.toString(),
    'c': `${process.env.BASE_URL || 'http://localhost:5000'}/payment-success?order=${orderId}&method=payme`
  });
  return `${baseUrl}?${params.toString()}`;
}

function generateClickUrl(orderId: string, amount: number): string {
  const merchantId = process.env.CLICK_MERCHANT_ID || 'test_merchant';
  const baseUrl = 'https://my.click.uz/services/pay';
  const params = new URLSearchParams({
    'service_id': merchantId,
    'merchant_id': merchantId,
    'amount': amount.toString(),
    'transaction_param': orderId,
    'return_url': `${process.env.BASE_URL || 'http://localhost:5000'}/payment-success?order=${orderId}&method=click`
  });
  return `${baseUrl}?${params.toString()}`;
}

// Keep local upload for fallback (if Cloudinary is not configured)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const localUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = nanoid();
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const localAudioUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = nanoid();
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'video/mp4', 'audio/mp4', 'application/octet-stream'];
    const allowedExt = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.mp4'];
    const okByExt = allowedExt.some((ext) => (file.originalname || '').toLowerCase().endsWith(ext));
    if (allowedTypes.includes(file.mimetype) || okByExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files (MP3, WAV, OGG, M4A, AAC, MP4) are allowed.'));
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit for audio files
  }
});

// Surface storage configuration at startup so production logs make it obvious
// whether uploads go to Cloudinary (persistent) or local disk (ephemeral on
// Render — files are lost on restart and break image/audio display).
if (process.env.CLOUDINARY_CLOUD_NAME) {
  console.log('[uploads] Cloudinary storage ENABLED (cloud:', process.env.CLOUDINARY_CLOUD_NAME + ')');
} else {
  console.warn('[uploads] Cloudinary NOT configured — falling back to LOCAL disk. On Render this is EPHEMERAL: uploaded files vanish on restart. Set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.');
}

// Use Cloudinary if configured, otherwise fallback to local
const upload = process.env.CLOUDINARY_CLOUD_NAME ? uploadImage : localUpload;
const audioUpload = process.env.CLOUDINARY_CLOUD_NAME ? uploadAudio : localAudioUpload;

// Wrap the audio multer middleware so multer/Cloudinary errors surface as a
// clear 4xx with the actual message, instead of an opaque 500 from the global
// error handler (which made the music-upload failure impossible to diagnose).
function audioUploadSingle(field: string) {
  return (req: any, res: any, next: any) => {
    audioUpload.single(field)(req, res, (err: any) => {
      if (err) {
        console.error('[audio-upload] failed:', err);
        const tooBig = err.code === 'LIMIT_FILE_SIZE';
        return res.status(tooBig ? 413 : 400).json({
          message: tooBig ? 'Audio file is too large (max 25MB)' : 'Audio upload failed',
          error: err.message || String(err),
        });
      }
      next();
    });
  };
}

// JWT secret key - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'wedding-platform-secret-key';

// Template tier classification (must match client-side)
const FREE_TEMPLATES = [
  'bohoChic',
  'classicTradition',
  'beachBliss',
  'rusticCharm',
  'modernElegance',
  'gardenRomance'
] as const;

const PREMIUM_TEMPLATES = [
  'epic',
  'flower'
] as const;

function isFreeTemplate(template: string): boolean {
  return (FREE_TEMPLATES as readonly string[]).includes(template);
}

function isPremiumTemplate(template: string): boolean {
  return (PREMIUM_TEMPLATES as readonly string[]).includes(template);
}

// Transliteration for building readable URL slugs from non-Latin names.
const SLUG_TRANSLIT: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',
  м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',
  щ:'sh',ъ:'',ы:'i',ь:'',э:'e',ю:'yu',я:'ya',ў:'o',қ:'q',ғ:'g',ҳ:'h',ә:'a',і:'i',
  ң:'ng',ө:'o',ұ:'u',ү:'u',һ:'h',
};

function slugifyName(s: string): string {
  return (s || '')
    .toLowerCase()
    .split('')
    .map((ch) => (ch in SLUG_TRANSLIT ? SLUG_TRANSLIT[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Build a readable, unique wedding URL slug from the couple's names, e.g.
// groom "Azamat" + bride "Sevara" -> "azamat-sevara". Falls back to a random
// id when names produce no usable slug, and appends a counter on collision so
// the unique_url constraint is never violated.
async function generateUniqueWeddingSlug(groom?: string, bride?: string): Promise<string> {
  const base = [slugifyName(groom || ''), slugifyName(bride || '')].filter(Boolean).join('-');
  if (!base) return nanoid(10);
  let candidate = base;
  let n = 1;
  while (await storage.getWeddingByUrl(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) { candidate = `${base}-${nanoid(5)}`; break; }
  }
  return candidate;
}

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('authenticateToken - auth header present:', !!authHeader);
  console.log('authenticateToken - token present:', !!token);

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log('authenticateToken - token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    console.log('authenticateToken - token verified, user:', user);
    req.user = user;
    next();
  });
};

// Middleware to verify wedding ownership
const verifyWeddingOwnership = async (req: any, res: any, next: any) => {
  try {
    const weddingId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Get the wedding
    const wedding = await storage.getWeddingById(weddingId);
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    // Get the user to check if they're admin
    const user = await storage.getUserById(userId);
    const isAdmin = user && (user.isAdmin === true || user.role === 'admin');

    // Check if user owns the wedding or is admin
    if (!isAdmin && wedding.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to this wedding' });
    }

    // Attach wedding to request for further use
    req.wedding = wedding;
    next();
  } catch (error) {
    console.error('Wedding ownership verification error:', error);
    res.status(500).json({ message: 'Server error during ownership verification' });
  }
};

// Middleware to check admin privileges
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user.userId;
    console.log('requireAdmin - checking user ID:', userId);

    const user = await storage.getUserById(userId);
    console.log('requireAdmin - user found:', user ? { id: user.id, email: user.email, isAdmin: user.isAdmin, role: user.role } : 'null');

    if (!user || (!user.isAdmin && user.role !== 'admin')) {
      console.log('requireAdmin - access denied for user:', userId);
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    console.log('requireAdmin - access granted for user:', userId);
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ message: 'Server error during admin verification' });
  }
};

// Admin authentication middleware
const authenticateAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Admin token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await storage.getUserById(decoded.userId);
    if (!user || (!user.isAdmin && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({ message: 'Invalid admin token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Backward-compat: older records saved Cloudinary uploads as
  // "/uploads/wedding-photos/<id>" or "/uploads/wedding-music/<id>" (a
  // Cloudinary public_id under a /uploads prefix). Those files are NOT on local
  // disk, so redirect them to the real Cloudinary delivery URL. New uploads
  // already store the full Cloudinary URL.
  app.get(/^\/uploads\/(wedding-photos|wedding-music)\/(.+)$/, (req, res, next) => {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloud) return next();
    const folder = (req.params as any)[0] as string;
    const publicId = (req.params as any)[1] as string;
    const resourceType = folder === 'wedding-music' ? 'video' : 'image';
    return res.redirect(302, `https://res.cloudinary.com/${cloud}/${resourceType}/upload/${folder}/${publicId}`);
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        isAdmin: false,
        role: 'user' as const,
        hasPaidSubscription: false,
        paymentMethod: null,
        paymentOrderId: null,
        paymentDate: null
      };

      const user = await storage.createUser(userData);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        user: userWithoutPassword,
        token,
        message: "Registration successful"
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token,
        message: "Login successful"
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/verify", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ message: "Token verification failed" });
    }
  });

  // Combined registration and wedding creation endpoint
  app.post("/api/get-started", async (req, res) => {
    try {
      // Parse and validate the combined data
      const data = req.body;

      console.log("Registration data received:", data);

      // Validate required fields
      if (!data.email || !data.password || !data.name || !data.bride || !data.groom) {
        console.log("Missing required fields:", {
          email: !!data.email,
          password: !!data.password,
          name: !!data.name,
          bride: !!data.bride,
          groom: !!data.groom
        });
        return res.status(400).json({
          message: "Missing required fields: email, password, name, bride, and groom are required"
        });
      }

      // Check if passwords match (if confirmPassword is provided)
      if (data.confirmPassword && data.password !== data.confirmPassword) {
        return res.status(400).json({ message: "Passwords don't match" });
      }

      // First, check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({
          message: "User with this email already exists. Please login instead."
        });
      }

      // Create user first
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password
      };
      const user = await storage.createUser(userData);

      // Check template tier - new users can only use free templates
      const template = data.template || 'gardenRomance';
      const templateRequiresPayment = isPremiumTemplate(template);

      if (templateRequiresPayment) {
        // New users cannot create premium templates without payment
        // Default to a free template if premium is selected
        const defaultTemplate = 'gardenRomance';
        console.log(`Premium template ${template} selected by new user, defaulting to ${defaultTemplate}`);
        data.template = defaultTemplate;
      }

      // Generate a readable URL slug from the couple's names
      const uniqueUrl = await generateUniqueWeddingSlug(data.groom, data.bride);

      // Then create wedding
      const weddingData = {
        bride: data.bride,
        groom: data.groom,
        weddingDate: new Date(data.weddingDate),
        venue: data.venue,
        venueAddress: data.venueAddress,
        template: data.template || 'gardenRomance',
        primaryColor: data.primaryColor || '#D4B08C',
        accentColor: data.accentColor || '#89916B',
        story: data.relationshipStory || '',
        rsvpMode: data.rsvpMode || 'both',
        isPublic: data.isPublic !== false
      };

      const wedding = await storage.createWedding(user.id, { ...weddingData, userId: user.id, uniqueUrl });

      res.status(201).json({
        user,
        wedding,
        message: "Registration and wedding website created successfully!"
      });
    } catch (error) {
      console.error("Get started error:", error);
      res.status(400).json({
        message: "Failed to create account and wedding website",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("User creation error:", error);
      res.status(400).json({
        message: "Failed to create user",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Check credentials against environment variables (trim to handle whitespace)
      const expectedUsername = process.env.ADMIN_USERNAME?.trim();
      const expectedPassword = process.env.ADMIN_PASSWORD?.trim();

      if (username === expectedUsername && password === expectedPassword) {
        // Create or get admin user
        let adminUser = await storage.getUserByEmail('admin@wedding-platform.com');

        if (!adminUser) {
          // Create admin user if it doesn't exist
          adminUser = await storage.createUser({
            email: 'admin@wedding-platform.com',
            name: 'System Administrator',
            password: 'admin-placeholder', // Not used for login
            role: 'admin',
            isAdmin: true,
            hasPaidSubscription: true
          });
        }

        // Generate JWT token for the admin user
        const token = jwt.sign(
          { userId: adminUser.id, email: adminUser.email, isAdmin: true },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = adminUser;

        res.json({
          user: userWithoutPassword,
          token,
          message: "Login successful"
        });
      } else {
        res.status(401).json({ message: "Invalid username or password. Please try again." });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin token verification endpoint
  app.get("/api/admin/verify", authenticateAdmin, async (req: any, res) => {
    try {
      // If authenticateAdmin middleware passes, user is verified admin
      res.json({
        success: true,
        message: "Admin access verified",
        user: req.user
      });
    } catch (error) {
      res.status(500).json({ message: "Server error during verification" });
    }
  });

  // Admin management routes - Full CRUD operations
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update user role and permissions
  app.put("/api/admin/users/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;

      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({
        message: "Failed to update user",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/admin/weddings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Get all weddings across all users
      const users = await storage.getAllUsers();
      const allWeddings = [];

      for (const user of users) {
        const userWeddings = await storage.getWeddingsByUserId(user.id);
        allWeddings.push(...userWeddings);
      }

      res.json(allWeddings);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin wedding creation route
  app.post("/api/admin/weddings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log("Admin wedding creation request:", req.body);

      const { userId, eventType, rsvpMode, bride, groom, weddingDate, venue, venueAddress, template, story, dearGuestMessage, couplePhotoUrl, primaryColor, accentColor, age, partyTheme, rsvpDeadline, giftRegistryInfo, contactPerson, specialInstructions } = req.body;

      // Validate required fields
      const missingFields = [];
      if (!userId) missingFields.push("userId");
      if (!bride) missingFields.push("bride");
      if (!groom && template !== 'birthday') missingFields.push("groom");
      if (!weddingDate) missingFields.push("weddingDate");

      if (missingFields.length > 0) {
        console.log("Missing required fields:", missingFields);
        return res.status(400).json({ message: `Missing required fields: ${missingFields.join(", ")} are required` });
      }

      // Check if user exists
      const user = await storage.getUserById(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate a readable URL slug from the couple's names
      const uniqueUrl = await generateUniqueWeddingSlug(groom, bride);

      const weddingData = {
        uniqueUrl: uniqueUrl, // Include the generated uniqueUrl
        eventType: eventType || "wedding", // NEW FIELD
        rsvpMode: rsvpMode || "both", // NEW FIELD
        bride: bride.trim(),
        groom: groom?.trim() || (template === 'birthday' ? 'Birthday Celebration' : ''), // Default value for birthday template
        weddingDate: new Date(weddingDate),
        venue: venue?.trim() || "",
        venueAddress: venueAddress?.trim() || "",
        story: story?.trim() || "",
        dearGuestMessage: dearGuestMessage?.trim() || "",
        couplePhotoUrl: couplePhotoUrl?.trim() || null,
        backgroundMusicUrl: req.body.backgroundMusicUrl?.trim() || null,
        template: template || "gardenRomance",
        primaryColor: primaryColor || "#D4B08C",
        accentColor: accentColor || "#89916B",

        weddingTime: req.body.weddingTime || "4:00 PM",
        timezone: req.body.timezone || "Asia/Tashkent",
        defaultLanguage: req.body.defaultLanguage || "en",
        availableLanguages: req.body.availableLanguages || ["en"],
        dressCode: req.body.dressCode || null,
        // Birthday-specific fields
        age: age?.trim() || null,
        partyTheme: partyTheme?.trim() || null,
        rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        giftRegistryInfo: giftRegistryInfo?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        specialInstructions: specialInstructions?.trim() || null,
        sections: req.body.sections || undefined,
        isPublic: true
      };

      console.log("Creating wedding with data:", weddingData);
      const wedding = await storage.createWedding(parseInt(userId), { ...weddingData, userId: parseInt(userId) });

      console.log("Wedding created successfully:", wedding);
      res.json(wedding);
    } catch (error) {
      console.error("Admin wedding creation error:", error);
      res.status(500).json({
        message: "Failed to create wedding",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin wedding update route
  app.put("/api/admin/weddings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const weddingId = parseInt(req.params.id);
      const updates = req.body;

      console.log("Admin updating wedding:", weddingId, "with data:", updates);

      // Convert date string to Date object if needed
      if (updates.weddingDate && typeof updates.weddingDate === 'string') {
        updates.weddingDate = new Date(updates.weddingDate);
      }

      // Convert birthday-specific date fields if needed
      if (updates.rsvpDeadline && typeof updates.rsvpDeadline === 'string') {
        updates.rsvpDeadline = new Date(updates.rsvpDeadline);
      }

      // Handle boolean conversion for isPublic
      if (updates.isPublic !== undefined) {
        updates.isPublic = updates.isPublic === true || updates.isPublic === 'true';
      }

      const wedding = await storage.updateWedding(weddingId, updates);

      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      console.log("Wedding updated successfully:", wedding);
      res.json(wedding);
    } catch (error) {
      console.error('Admin update wedding error:', error);
      res.status(500).json({ message: "Failed to update wedding" });
    }
  });

  app.delete("/api/admin/weddings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const weddingId = parseInt(req.params.id);

      // Delete wedding from storage
      const success = await storage.deleteWedding ? await storage.deleteWedding(weddingId) : true;

      if (success) {
        res.json({ message: "Wedding deleted successfully" });
      } else {
        res.status(404).json({ message: "Wedding not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/admin/weddings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const weddingId = parseInt(req.params.id);
      const updates = req.body;
      console.log('Updating wedding ID:', weddingId);
      console.log('Update data:', JSON.stringify(updates, null, 2));

      // Convert date string to Date object if needed
      if (updates.weddingDate && typeof updates.weddingDate === 'string') {
        updates.weddingDate = new Date(updates.weddingDate);
        console.log('Converted wedding date to:', updates.weddingDate);
      }

      const wedding = await storage.updateWedding(weddingId, updates);
      console.log('Update result:', wedding);

      if (wedding) {
        res.json(wedding);
      } else {
        res.status(404).json({ message: "Wedding not found" });
      }
    } catch (error) {
      console.error('Wedding update error:', error);
      res.status(400).json({
        message: "Failed to update wedding",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get current user - requires authentication
  app.get("/api/user/current", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user's own weddings only - SECURE ROUTE
  app.get("/api/user/weddings", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const weddings = await storage.getWeddingsByUserId(userId);
      res.json(weddings);
    } catch (error) {
      console.error("Get user weddings error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Guest manager route - only for users with guest_manager role
  app.get("/api/guest-manager/weddings", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow guest managers and admins
      if (user.role !== 'guest_manager' && !user.isAdmin) {
        return res.status(403).json({ message: "Access denied. Guest manager role required." });
      }

      // Guest managers can only see their own weddings
      const weddings = await storage.getWeddingsByUserId(userId);
      res.json(weddings);
    } catch (error) {
      console.error("Guest manager weddings error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get specific wedding by ID - with ownership verification
  app.get("/api/weddings/:id", authenticateToken, verifyWeddingOwnership, async (req: any, res) => {
    try {
      // Wedding is already attached by middleware and ownership verified
      res.json(req.wedding);
    } catch (error) {
      console.error("Get wedding error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Wedding owner update route - with authorization
  app.put("/api/weddings/:id", authenticateToken, verifyWeddingOwnership, async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.id);
      const updates = req.body;

      // Convert date string to Date object if needed
      if (updates.weddingDate && typeof updates.weddingDate === 'string') {
        updates.weddingDate = new Date(updates.weddingDate);
      }

      const wedding = await storage.updateWedding(weddingId, updates);

      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      res.json(wedding);
    } catch (error) {
      console.error('Update wedding error:', error);
      res.status(400).json({ message: "Failed to update wedding" });
    }
  });

  // Get wedding language settings
  app.get("/api/weddings/:id/languages", authenticateToken, verifyWeddingOwnership, async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.id);
      const wedding = await storage.getWeddingById(weddingId);

      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      res.json({
        availableLanguages: wedding.availableLanguages || ['en'],
        defaultLanguage: wedding.defaultLanguage || 'en'
      });
    } catch (error) {
      console.error('Get wedding languages error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update wedding language settings
  app.put("/api/weddings/:id/languages", authenticateToken, verifyWeddingOwnership, async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.id);
      const { availableLanguages, defaultLanguage } = req.body;

      // Validate languages
      const supportedLanguages = ['en', 'uz', 'ru'];
      if (!Array.isArray(availableLanguages) || availableLanguages.length === 0) {
        return res.status(400).json({ message: "At least one language must be selected" });
      }

      const invalidLanguages = availableLanguages.filter(lang => !supportedLanguages.includes(lang));
      if (invalidLanguages.length > 0) {
        return res.status(400).json({ message: `Unsupported languages: ${invalidLanguages.join(', ')}` });
      }

      if (!availableLanguages.includes(defaultLanguage)) {
        return res.status(400).json({ message: "Default language must be in available languages list" });
      }

      const updatedWedding = await storage.updateWedding(weddingId, {
        availableLanguages,
        defaultLanguage
      });

      if (!updatedWedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      res.json({
        availableLanguages: updatedWedding.availableLanguages,
        defaultLanguage: updatedWedding.defaultLanguage
      });
    } catch (error) {
      console.error('Update wedding languages error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete wedding - with ownership verification
  app.delete("/api/weddings/:id", authenticateToken, verifyWeddingOwnership, async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.id);
      const success = await storage.deleteWedding(weddingId);

      if (success) {
        res.json({ message: "Wedding deleted successfully" });
      } else {
        res.status(404).json({ message: "Wedding not found" });
      }
    } catch (error) {
      console.error('Wedding deletion error:', error);
      res.status(500).json({ message: "Failed to delete wedding" });
    }
  });

  // Get guests for a specific wedding - with ownership verification
  app.get("/api/weddings/:id/guests", authenticateToken, verifyWeddingOwnership, async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.id);
      const guests = await storage.getGuestsByWeddingId(weddingId);
      res.json(guests);
    } catch (error) {
      console.error('Get guests error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create guest for a specific wedding - with ownership verification
  app.post("/api/weddings/:id/guests", authenticateToken, verifyWeddingOwnership, async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.id);
      const guestData = { ...req.body, weddingId };

      const guest = await storage.createGuest(guestData);
      res.status(201).json(guest);
    } catch (error) {
      console.error('Create guest error:', error);
      res.status(400).json({ message: "Failed to create guest" });
    }
  });

  // Update RSVP for a guest - public endpoint (no authentication required)
  app.put("/api/guests/:guestId/rsvp", async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const rsvpData = req.body;

      const guest = await storage.updateGuestRSVP(guestId, rsvpData);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      // Broadcast real-time update
      const broadcastToWedding = (global as any).broadcastToWedding;
      if (broadcastToWedding) {
        broadcastToWedding(guest.weddingId, {
          type: 'rsvp_updated',
          guest: guest
        });
      }

      res.json(guest);
    } catch (error) {
      console.error('RSVP update error:', error);
      res.status(500).json({ message: "Failed to update RSVP" });
    }
  });

  // Get photos for a specific wedding - with ownership verification
  app.get("/api/weddings/:id/photos", authenticateToken, verifyWeddingOwnership, async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.id);
      const photos = await storage.getPhotosByWeddingId(weddingId);
      res.json(photos);
    } catch (error) {
      console.error('Get photos error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create photo for a specific wedding - with ownership verification
  app.post("/api/weddings/:id/photos", authenticateToken, verifyWeddingOwnership, upload.single('photo'), async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.id);

      if (!req.file) {
        return res.status(400).json({ message: "Photo file required" });
      }

      const photoData = {
        weddingId,
        url: `/uploads/${req.file.filename}`,
        caption: req.body.caption || '',
        uploadedBy: req.body.uploadedBy || 'Wedding Owner'
      };

      const photo = await storage.createPhoto(photoData);
      res.status(201).json(photo);
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(400).json({ message: "Failed to upload photo" });
    }
  });

  // Delete photo endpoint for wedding owners - with proper ownership verification
  app.delete("/api/photos/:id", authenticateToken, async (req: any, res) => {
    try {
      const photoId = parseInt(req.params.id);

      // Get all photos to find the one being deleted (this needs storage improvement)
      const allUsers = await storage.getAllUsers();
      let targetPhoto = null;
      let targetWedding = null;

      for (const user of allUsers) {
        const weddings = await storage.getWeddingsByUserId(user.id);
        for (const wedding of weddings) {
          const photos = await storage.getPhotosByWeddingId(wedding.id);
          const photo = photos.find(p => p.id === photoId);
          if (photo) {
            targetPhoto = photo;
            targetWedding = wedding;
            break;
          }
        }
        if (targetPhoto) break;
      }

      if (!targetPhoto || !targetWedding) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Verify ownership
      const user = await storage.getUserById(req.user.userId);
      const isAdmin = user && (user.isAdmin === true || user.role === 'admin');

      if (!isAdmin && targetWedding.userId !== req.user.userId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      const success = await storage.deletePhoto(photoId);

      if (success) {
        res.json({ message: "Photo deleted successfully" });
      } else {
        res.status(404).json({ message: "Photo not found" });
      }
    } catch (error) {
      console.error('Photo deletion error:', error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  app.get("/api/admin/guests/:weddingId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);
      const guests = await storage.getGuestsByWeddingId(weddingId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/guests", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const guestData = req.body;
      const guest = await storage.createGuest(guestData);
      res.status(201).json(guest);
    } catch (error) {
      res.status(400).json({ message: "Failed to create guest" });
    }
  });

  // User management routes for admin
  app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;

      const user = await storage.updateUser(userId, updates);

      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);

      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const realUsers = users.filter(u => !u.email.includes('guest_'));
      const guestUsers = users.filter(u => u.email.includes('guest_'));

      let totalWeddings = 0;
      let publicWeddings = 0;
      let totalGuests = 0;

      for (const user of users) {
        const userWeddings = await storage.getWeddingsByUserId(user.id);
        totalWeddings += userWeddings.length;
        publicWeddings += userWeddings.filter(w => w.isPublic).length;

        for (const wedding of userWeddings) {
          const guests = await storage.getGuestsByWeddingId(wedding.id);
          totalGuests += guests.length;
        }
      }

      res.json({
        totalUsers: realUsers.length,
        guestUsers: guestUsers.length,
        totalWeddings,
        publicWeddings,
        totalGuests
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // RSVP management endpoints for admin
  app.get("/api/admin/rsvp-stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      let totalRSVPs = 0;
      let confirmedRSVPs = 0;
      let pendingRSVPs = 0;
      let declinedRSVPs = 0;
      let maybeRSVPs = 0;

      for (const user of users) {
        const userWeddings = await storage.getWeddingsByUserId(user.id);

        for (const wedding of userWeddings) {
          const guests = await storage.getGuestsByWeddingId(wedding.id);
          totalRSVPs += guests.length;

          guests.forEach(guest => {
            switch (guest.rsvpStatus) {
              case 'confirmed':
                confirmedRSVPs++;
                break;
              case 'pending':
                pendingRSVPs++;
                break;
              case 'declined':
                declinedRSVPs++;
                break;
              case 'maybe':
                maybeRSVPs++;
                break;
            }
          });
        }
      }

      res.json({
        totalRSVPs,
        confirmedRSVPs,
        pendingRSVPs,
        declinedRSVPs,
        maybeRSVPs
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/rsvp", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const allGuests = [];

      for (const user of users) {
        const userWeddings = await storage.getWeddingsByUserId(user.id);

        for (const wedding of userWeddings) {
          const guests = await storage.getGuestsByWeddingId(wedding.id);
          allGuests.push(...guests.map(guest => ({
            ...guest,
            wedding: {
              id: wedding.id,
              bride: wedding.bride,
              groom: wedding.groom,
              weddingDate: wedding.weddingDate,
              venue: wedding.venue
            }
          })));
        }
      }

      res.json(allGuests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Photo management endpoints for admin
  app.get("/api/admin/photos", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const allPhotos = [];

      for (const user of users) {
        const userWeddings = await storage.getWeddingsByUserId(user.id);

        for (const wedding of userWeddings) {
          const photos = await storage.getPhotosByWeddingId(wedding.id);
          allPhotos.push(...photos.map(photo => ({
            ...photo,
            wedding: {
              id: wedding.id,
              bride: wedding.bride,
              groom: wedding.groom,
              uniqueUrl: wedding.uniqueUrl
            }
          })));
        }
      }

      res.json(allPhotos);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/photos", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const photoData = req.body;
      const photo = await storage.createPhoto(photoData);
      res.status(201).json(photo);
    } catch (error) {
      res.status(400).json({ message: "Failed to create photo" });
    }
  });

  app.put("/api/admin/photos/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const updates = req.body;

      // Note: This would need to be implemented in storage interface
      res.json({ message: "Photo updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update photo" });
    }
  });

  app.delete("/api/admin/photos/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const success = await storage.deletePhoto(photoId);

      if (success) {
        res.json({ message: "Photo deleted successfully" });
      } else {
        res.status(404).json({ message: "Photo not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  app.post("/api/users/guest", async (req, res) => {
    try {
      // Generate temporary guest user for immediate wedding creation
      const timestamp = Date.now();
      const guestEmail = `guest_${timestamp}@example.com`;
      const guestName = `Guest User ${timestamp}`;

      // Create temporary guest user
      const user = await storage.createUser({
        email: guestEmail,
        name: guestName,
        password: 'temp_guest'
      });

      res.json(user);
    } catch (error) {
      console.error("Guest user creation error:", error);
      res.status(400).json({
        message: "Failed to create guest user",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Payment routes
  app.post("/api/create-payment", async (req, res) => {
    try {
      const { userId, paymentMethod, amount = 50000 } = req.body; // 50,000 UZS default price

      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has paid subscription
      if (user.hasPaidSubscription) {
        return res.status(400).json({ message: "User already has a paid subscription" });
      }

      const orderId = `wedding_${userId}_${Date.now()}`;

      let paymentUrl;
      if (paymentMethod === 'click') {
        paymentUrl = generateClickUrl(orderId, amount);
      } else if (paymentMethod === 'payme') {
        paymentUrl = generatePaymeUrl(orderId, amount);
      } else {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      res.json({
        orderId,
        paymentUrl,
        amount,
        paymentMethod
      });
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { orderId, paymentMethod } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Order ID required" });
      }

      // Extract user ID from order ID
      const userId = parseInt(orderId.split('_')[1]);

      // Update user payment status
      const user = await storage.updateUser(userId, {
        hasPaidSubscription: true,
        paymentMethod,
        paymentOrderId: orderId,
        paymentDate: new Date()
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        success: true,
        message: "Payment verified successfully",
        user
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Couple photo upload endpoint for admin
  app.post('/api/upload/couple-photo', authenticateToken, requireAdmin, upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // When Cloudinary is configured, req.file.path is the hosted (persistent)
      // URL. Local disk (req.file.filename -> /uploads) is ephemeral on Render,
      // so prefer the Cloudinary URL whenever it is available.
      const photoUrl = (process.env.CLOUDINARY_CLOUD_NAME && (req.file as any).path)
        ? (req.file as any).path
        : `/uploads/${req.file.filename}`;
      res.json({
        url: photoUrl,
        message: 'Couple photo uploaded successfully',
        publicId: req.file.filename // For Cloudinary deletion later
      });
    } catch (error) {
      console.error('Couple photo upload error:', error);
      res.status(500).json({ message: 'Failed to upload couple photo' });
    }
  });

  // Test audio URL accessibility endpoint
  app.get('/api/test-audio/*', async (req, res) => {
    try {
      const audioUrl = decodeURIComponent((req.params as any)[0]);
      console.log('Testing audio URL:', audioUrl);

      const response = await fetch(audioUrl, { method: 'HEAD' });

      res.json({
        url: audioUrl,
        accessible: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        lastModified: response.headers.get('last-modified'),
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error) {
      console.error('Audio URL test error:', error);
      res.status(500).json({
        url: (req.params as any)[0],
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Background music upload endpoint for users (wedding creation)
  app.post('/api/upload/wedding-music', authenticateToken, audioUploadSingle('music'), async (req: any, res) => {
    try {
      console.log('Wedding music upload request received');
      console.log('User:', req.user);
      console.log('Request file:', req.file);

      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('File details:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      // Get the URL - either from Cloudinary or local storage
      let musicUrl: string;
      
      if (process.env.CLOUDINARY_CLOUD_NAME && (req.file as any).path) {
        // Using Cloudinary
        musicUrl = (req.file as any).path;
        console.log('Cloudinary URL:', musicUrl);
      } else {
        // Using local storage
        musicUrl = `/uploads/${req.file.filename}`;
        console.log('Local storage URL:', musicUrl);
      }

      res.json({
        url: musicUrl,
        message: 'Background music uploaded successfully',
        filename: req.file.filename,
        originalname: req.file.originalname,
      });
    } catch (error) {
      console.error('Wedding music upload error:', error);
      res.status(500).json({ 
        message: 'Failed to upload background music', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Background music upload endpoint for admin
  app.post('/api/upload/background-music', authenticateToken, requireAdmin, audioUploadSingle('music'), async (req, res) => {
    try {
      console.log('Background music upload request received');
      console.log('Request headers:', req.headers);
      console.log('Request file:', req.file);

      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('File details:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      // When Cloudinary is configured, req.file.path is the hosted (persistent)
      // URL. Local disk (/uploads) is ephemeral on Render, so prefer Cloudinary.
      const musicUrl = (process.env.CLOUDINARY_CLOUD_NAME && (req.file as any).path)
        ? (req.file as any).path
        : `/uploads/${req.file.filename}`;

      console.log('Music URL generated:', musicUrl);

      res.json({
        url: musicUrl,
        message: 'Background music uploaded successfully',
        publicId: req.file.filename // For Cloudinary deletion later
      });
    } catch (error) {
      console.error('Background music upload error:', error);
      res.status(500).json({ message: 'Failed to upload background music', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Wedding routes
  app.post("/api/weddings", authenticateToken, async (req: any, res) => {
    try {
      console.log("Wedding creation request:", JSON.stringify(req.body, null, 2));

      const userId = req.user.userId; // Use authenticated user's ID
      const weddingFields = req.body;

      // Check if user exists and is not a guest user
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent guest users from creating weddings
      if (user.email.includes('guest_')) {
        return res.status(403).json({
          message: "Guest users cannot create weddings. Please register for a full account."
        });
      }

      // Check template tier and payment requirements
      const template = weddingFields.template || 'gardenRomance';
      const templateRequiresPayment = isPremiumTemplate(template);

      // Only require payment for premium templates (unless user has paid subscription or is admin)
      if (templateRequiresPayment && !user.hasPaidSubscription && !user.isAdmin) {
        return res.status(403).json({
          message: "Premium templates require payment. Please complete payment first or choose a free template."
        });
      }

      // Free templates can be created without payment

      // Validate required fields - only bride, groom, and weddingDate are required
      if (!weddingFields.bride || !weddingFields.groom || !weddingFields.weddingDate) {
        console.log("Missing required fields:", {
          bride: !!weddingFields.bride,
          groom: !!weddingFields.groom,
          weddingDate: !!weddingFields.weddingDate
        });
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Generate a readable URL slug from the couple's names
      const uniqueUrl = await generateUniqueWeddingSlug(weddingFields.groom, weddingFields.bride);

      // Create wedding data with all required fields
      const weddingData = {
        bride: weddingFields.bride,
        groom: weddingFields.groom,
        weddingDate: new Date(weddingFields.weddingDate),
        venue: weddingFields.venue || "",
        venueAddress: weddingFields.venueAddress || "",
        story: weddingFields.story || "",
        dearGuestMessage: weddingFields.dearGuestMessage || null,
        couplePhotoUrl: weddingFields.couplePhotoUrl || null,
        backgroundMusicUrl: weddingFields.backgroundMusicUrl || null,
        template: weddingFields.template || "gardenRomance",
        primaryColor: weddingFields.primaryColor || "#D4B08C",
        accentColor: weddingFields.accentColor || "#89916B",
        uniqueUrl,
        weddingTime: req.body.weddingTime || "4:00 PM",
        timezone: req.body.timezone || "Asia/Tashkent",
        defaultLanguage: weddingFields.defaultLanguage || "en",
        availableLanguages: weddingFields.availableLanguages || ["en"],
        dressCode: weddingFields.dressCode || null,
        rsvpMode: weddingFields.rsvpMode || 'both',
        // Per-section visibility toggles (undefined → DB default = all shown).
        sections: weddingFields.sections || undefined,
        isPublic: true
      };

      console.log("Processed wedding data:", weddingData);

      const wedding = await storage.createWedding(userId, { ...weddingData, userId });
      console.log("Wedding created successfully:", wedding);
      res.status(201).json(wedding);
    } catch (error) {
      console.error("Wedding creation error:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({
        message: "Failed to create wedding",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin guest manager routes
  app.post("/api/admin/create-guest-manager", async (req, res) => {
    try {
      const { email, name, weddingId } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create guest manager user
      const userData = {
        email,
        name,
        password: "temporary123", // Guest manager will need to change this
        role: "guest_manager" as const,
        isAdmin: false,
        hasPaidSubscription: false
      };

      const newUser = await storage.createUser(userData);

      // Create wedding access permissions
      const accessData = {
        userId: newUser.id,
        weddingId: parseInt(weddingId),
        accessLevel: "guest_manager" as const,
        permissions: {
          canEditDetails: false,
          canManageGuests: true,
          canViewAnalytics: false,
          canManagePhotos: false,
          canEditGuestBook: false
        }
      };

      await storage.createWeddingAccess(accessData);

      res.json({ success: true, user: newUser });
    } catch (error) {
      res.status(500).json({ message: "Failed to create guest manager" });
    }
  });

  app.post("/api/admin/assign-guest-manager", async (req, res) => {
    try {
      const { userId, weddingId } = req.body;

      // Check if user exists and is guest manager
      const user = await storage.getUserById(userId);
      if (!user || user.role !== 'guest_manager') {
        return res.status(400).json({ message: "Invalid user or user is not a guest manager" });
      }

      // Check if access already exists
      const existingAccess = await storage.getUserWeddingPermissions(userId, weddingId);
      if (existingAccess) {
        return res.status(400).json({ message: "User already has access to this wedding" });
      }

      const accessData = {
        userId,
        weddingId,
        accessLevel: "guest_manager" as const,
        permissions: {
          canEditDetails: false,
          canManageGuests: true,
          canViewAnalytics: false,
          canManagePhotos: false,
          canEditGuestBook: false
        }
      };

      const access = await storage.createWeddingAccess(accessData);
      res.json(access);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign guest manager" });
    }
  });

  app.get("/api/admin/wedding-access/:weddingId", async (req, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);
      // This would need a new storage method to get access by wedding ID
      // For now, we'll return an empty array
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wedding access" });
    }
  });

  app.delete("/api/admin/wedding-access/:accessId", async (req, res) => {
    try {
      const accessId = parseInt(req.params.accessId);
      const success = await storage.deleteWeddingAccess(accessId);

      if (!success) {
        return res.status(404).json({ message: "Access not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove access" });
    }
  });

  // Admin endpoint to create a wedding for a guest manager
  app.post("/api/admin/create-guest-manager-wedding", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { guestManagerId, bride, groom, weddingDate, venue } = req.body;

      if (!guestManagerId || !bride || !groom) {
        return res.status(400).json({ message: "Guest manager ID, bride, and groom are required" });
      }

      // Verify the user is a guest manager
      const guestManager = await storage.getUserById(guestManagerId);
      if (!guestManager || guestManager.role !== 'guest_manager') {
        return res.status(400).json({ message: "Invalid guest manager ID" });
      }

      // Create wedding for the guest manager
      const weddingData = {
        bride: bride,
        groom: groom,
        weddingDate: new Date(weddingDate || '2025-08-15'),
        venue: venue || 'Garden Palace Hotel',
        description: 'A beautiful wedding celebration',
        isPublic: true,
        template: 'garden-romance',
        primaryColor: '#D4B08C',
        accentColor: '#89916B',
        rsvpMode: 'both'
      };

      const wedding = await storage.createWedding(guestManagerId, { ...weddingData, userId: guestManagerId, uniqueUrl: nanoid(10), venueAddress: '' });

      // Add some sample guests
      const sampleGuests = [
        {
          name: 'Dilshod Karimov',
          email: 'dilshod@example.com',
          phone: '+998901234567',
          rsvpStatus: 'confirmed' as const,
          category: 'family' as const,
          side: 'groom' as const,
          weddingId: wedding.id
        },
        {
          name: 'Malika Tosheva',
          email: 'malika@example.com',
          phone: '+998902345678',
          rsvpStatus: 'pending' as const,
          category: 'friends' as const,
          side: 'bride' as const,
          weddingId: wedding.id
        },
        {
          name: 'Rustam Alimov',
          email: 'rustam@example.com',
          phone: '+998903456789',
          rsvpStatus: 'confirmed' as const,
          category: 'colleagues' as const,
          side: 'groom' as const,
          weddingId: wedding.id
        },
        {
          name: 'Sevara Nazarova',
          email: 'sevara@example.com',
          phone: '+998904567890',
          rsvpStatus: 'maybe' as const,
          category: 'family' as const,
          side: 'bride' as const,
          weddingId: wedding.id
        },
        {
          name: 'Bobur Rahimov',
          email: 'bobur@example.com',
          phone: '+998905678901',
          rsvpStatus: 'declined' as const,
          category: 'friends' as const,
          side: 'groom' as const,
          weddingId: wedding.id
        }
      ];

      // Create the sample guests
      for (const guestData of sampleGuests) {
        await storage.createGuest(guestData);
      }

      res.json({
        message: "Wedding and sample guests created successfully for guest manager",
        wedding: wedding,
        guestsCreated: sampleGuests.length
      });

    } catch (error) {
      console.error("Create guest manager wedding error:", error);
      res.status(500).json({ message: "Failed to create wedding for guest manager" });
    }
  });

  // Guest manager dashboard - restricted wedding list
  app.get("/api/guest-manager/weddings", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;

      // Check if user has guest_manager role
      const user = await storage.getUserById(userId);
      if (!user || user.role !== 'guest_manager') {
        return res.json([]);
      }

      // Get only user's own weddings - guest managers should only see their own created weddings
      const ownedWeddings = await storage.getWeddingsByUserId(userId);

      // Get weddings they have guest manager access to (but mark them as managed, not owned)
      const accessRecords = await storage.getWeddingAccessByUserId(userId);
      const managedWeddings = [];

      for (const access of accessRecords) {
        const wedding = await storage.getWeddingById(access.weddingId);
        if (wedding && wedding.userId !== userId) { // Only include if not owned by user
          managedWeddings.push({
            ...wedding,
            accessLevel: access.accessLevel,
            permissions: access.permissions,
            isManaged: true, // Flag to distinguish managed from owned
            originalOwner: wedding.userId
          });
        }
      }

      // Combine owned and managed weddings
      const allWeddings = [
        ...ownedWeddings.map(w => ({ ...w, isManaged: false })),
        ...managedWeddings
      ];

      res.json(allWeddings);
    } catch (error) {
      console.error('Guest manager weddings error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Check if user has access to specific wedding
  app.get("/api/user/wedding-access/:userId/:weddingId", authenticateToken, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const weddingId = parseInt(req.params.weddingId);

      // Only allow users to check their own access or admin users
      const requestingUserId = req.user.userId;
      const requestingUser = await storage.getUserById(requestingUserId);

      if (requestingUserId !== userId && !requestingUser?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const access = await storage.getUserWeddingPermissions(userId, weddingId);
      if (!access) {
        return res.status(404).json({ message: "No access found" });
      }

      res.json(access);
    } catch (error) {
      console.error('Wedding access check error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Guest book endpoints
  app.get("/api/guestbook/:weddingId", async (req, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);
      const entries = await storage.getGuestBookEntriesByWeddingId(weddingId);
      res.json(entries);
    } catch (error) {
      console.error('Get guest book entries error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/guestbook/:weddingId", authenticateToken, async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);
      const { guestName, message } = req.body;

      // Validate input
      if (!guestName?.trim() || !message?.trim()) {
        return res.status(400).json({ message: "Guest name and message are required" });
      }

      // Check if user has access to this wedding
      const userId = req.user.userId;
      const user = await storage.getUserById(userId);
      const wedding = await storage.getWeddingById(weddingId);

      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      // Check access: owner, admin, or guest manager with wedding access
      const isOwner = wedding.userId === userId;
      const isAdmin = user?.isAdmin || user?.role === 'admin';
      const hasGuestManagerAccess = user?.role === 'guest_manager' &&
        await storage.getUserWeddingPermissions(userId, weddingId);

      if (!isOwner && !isAdmin && !hasGuestManagerAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const entry = await storage.createGuestBookEntry({
        weddingId,
        guestName: guestName.trim(),
        message: message.trim(),
      });

      res.json(entry);
    } catch (error) {
      console.error('Create guest book entry error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/guestbook/entry/:entryId", authenticateToken, async (req: any, res) => {
    try {
      const entryId = parseInt(req.params.entryId);
      const userId = req.user.userId;
      const user = await storage.getUserById(userId);

      // Get the entry to check wedding ownership
      const entries = await storage.getGuestBookEntriesByWeddingId(0); // Get all entries to find this one
      const entry = entries.find(e => e.id === entryId);

      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      const wedding = await storage.getWeddingById(entry.weddingId);
      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      // Only owner or admin can delete entries
      const isOwner = wedding.userId === userId;
      const isAdmin = user?.isAdmin || user?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Note: We'll need to implement deleteGuestBookEntry in storage
      // For now, return success
      res.json({ success: true });
    } catch (error) {
      console.error('Delete guest book entry error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/weddings/url/:uniqueUrl", async (req, res) => {
    try {
      const { uniqueUrl } = req.params;
      const wedding = await storage.getWeddingByUrl(uniqueUrl);

      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      // Approval gate. Admins may always view (to review for approval). The
      // owner may fetch their own wedding for the management page, but must NOT
      // be able to view the PUBLIC site (?view=public) until it is approved.
      // Guests never see an unapproved site.
      const token = req.headers.authorization?.split(' ')[1];
      let isAdmin = false;
      let isOwner = false;

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          isAdmin = !!decoded.isAdmin;
          isOwner = decoded.userId === wedding.userId;
        } catch (err) {
          // Invalid token, treat as guest
        }
      }

      const isPublicView = req.query.view === 'public';
      const canView = wedding.isApproved || isAdmin || (isOwner && !isPublicView);
      if (!canView) {
        return res.status(403).json({
          message: "This wedding website is pending admin approval. Please contact the administrator.",
          pendingApproval: true
        });
      }

      res.json(wedding);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/weddings/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const weddings = await storage.getWeddingsByUserId(userId);
      res.json(weddings);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/weddings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const wedding = await storage.updateWedding(id, updates);
      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      res.json(wedding);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Guest routes
  app.post("/api/guests", authenticateToken, async (req, res) => {
    try {
      const guestData = insertGuestSchema.parse(req.body);
      const guest = await storage.createGuest(guestData);

      // Broadcast real-time update
      const broadcastToWedding = (global as any).broadcastToWedding;
      if (broadcastToWedding) {
        broadcastToWedding(guest.weddingId, {
          type: 'guest_added',
          guest: guest
        });
      }

      res.status(201).json(guest);
    } catch (error) {
      res.status(400).json({ message: "Invalid guest data" });
    }
  });

  app.get("/api/guests/wedding/:weddingId", authenticateToken, async (req: any, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);
      const userId = req.user.userId;

      // Verify user has access to this wedding
      const wedding = await storage.getWeddingById(weddingId);
      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is admin, wedding owner, or has guest manager access to this wedding
      const isAdmin = user.isAdmin === true || user.role === 'admin';
      const isOwner = wedding.userId === userId;
      // Allow guest managers to access any wedding for now (temporary fix)
      const isGuestManager = user.role === 'guest_manager';

      if (!isAdmin && !isOwner && !isGuestManager) {
        return res.status(403).json({ message: "Access denied. You don't have permission to view guests for this wedding." });
      }

      const guests = await storage.getGuestsByWeddingId(weddingId);
      res.json(guests);
    } catch (error) {
      console.error("Get wedding guests error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Public endpoint for guests to see the guest list for RSVP purposes
  app.get("/api/guests/public/:weddingId", async (req, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);

      // Verify wedding exists and is public
      const wedding = await storage.getWeddingById(weddingId);
      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      if (!wedding.isPublic) {
        return res.status(403).json({ message: "This wedding is private" });
      }

      const guests = await storage.getGuestsByWeddingId(weddingId);

      // Filter out sensitive information for public access
      const publicGuests = guests.map(guest => ({
        id: guest.id,
        name: guest.name,
        email: guest.email, // Keep email for guest identification
        rsvpStatus: guest.rsvpStatus,
        // Remove sensitive fields like phone, address, notes, etc.
      }));

      res.json(publicGuests);
    } catch (error) {
      console.error("Get public wedding guests error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Public RSVP endpoint for new guests (no authentication required)
  app.post("/api/weddings/:weddingId/rsvp", async (req, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);

      // Verify wedding exists and is public
      const wedding = await storage.getWeddingById(weddingId);
      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      if (!wedding.isPublic) {
        return res.status(403).json({ message: "This wedding is private" });
      }

      // Parse and create guest data
      const guestData = insertGuestSchema.parse({
        ...req.body,
        weddingId: weddingId
      });

      const guest = await storage.createGuest(guestData);

      // Broadcast real-time update
      const broadcastToWedding = (global as any).broadcastToWedding;
      if (broadcastToWedding) {
        broadcastToWedding(guest.weddingId, {
          type: 'guest_added',
          guest: guest
        });
      }

      res.status(201).json(guest);
    } catch (error) {
      console.error('Public RSVP creation error:', error);
      res.status(400).json({ message: "Invalid RSVP data" });
    }
  });


  // Guest update and delete endpoints
  app.patch("/api/guests/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      // Get the guest first to check wedding ownership
      const existingGuest = await storage.getGuestsByWeddingId(0).then(guests =>
        guests.find(g => g.id === id)
      );

      if (!existingGuest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      const guest = await storage.updateGuestRSVP(id, updateData);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      // Broadcast real-time update
      const broadcastToWedding = (global as any).broadcastToWedding;
      if (broadcastToWedding) {
        broadcastToWedding(guest.weddingId, {
          type: 'guest_updated',
          guest: guest
        });
      }

      res.json(guest);
    } catch (error) {
      console.error('Guest update error:', error);
      res.status(500).json({ message: "Failed to update guest" });
    }
  });

  app.delete("/api/guests/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.userId;

      // First, get the guest to find the wedding it belongs to
      const guest = await storage.getGuestById(id);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      // Get the wedding to check ownership
      const wedding = await storage.getWeddingById(guest.weddingId);
      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      // Get user details
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check permissions: admin, wedding owner, or guest manager with wedding access
      const isAdmin = user.isAdmin === true || user.role === 'admin';
      const isOwner = wedding.userId === userId;
      const hasGuestManagerAccess = user.role === 'guest_manager' &&
        await storage.getUserWeddingPermissions(userId, guest.weddingId);

      if (!isAdmin && !isOwner && !hasGuestManagerAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteGuest(id);

      if (!deleted) {
        return res.status(404).json({ message: "Guest not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Guest delete error:', error);
      res.status(500).json({ message: "Failed to delete guest" });
    }
  });

  // Photo routes
  app.post("/api/photos", async (req, res) => {
    try {
      const photoData = insertPhotoSchema.parse(req.body);
      const photo = await storage.createPhoto(photoData);
      res.status(201).json(photo);
    } catch (error) {
      res.status(400).json({ message: "Invalid photo data" });
    }
  });

  // Real photo upload endpoint with multer
  app.post("/api/photos/upload", upload.single('photo'), async (req, res) => {
    try {
      const { weddingId, photoType, caption } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: 'No photo file provided.' });
      }
      if (!weddingId) {
        return res.status(400).json({ message: 'Wedding ID is required.' });
      }

      const parsedWeddingId = parseInt(weddingId, 10);
      if (isNaN(parsedWeddingId)) {
        return res.status(400).json({ message: 'Invalid Wedding ID format.' });
      }

      // Always use the web-accessible path; req.file.path is a filesystem path
      const photoUrl = `/uploads/${req.file.filename}`;

      // Create the photo entry in the photos table
      const newPhoto = await storage.createPhoto({
        weddingId: parsedWeddingId,
        url: photoUrl,
        caption: caption || null,
        photoType: photoType || 'memory',
      });

      // If it's a couple photo, also update the main wedding record's couplePhotoUrl
      if (photoType === 'couple') {
        await storage.updateWedding(parsedWeddingId, {
          couplePhotoUrl: photoUrl
        });
      }

      res.status(201).json(newPhoto);
    } catch (error) {
      console.error('Photo upload error:', error);
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: "File too large. Maximum size is 5MB." });
      }
      res.status(500).json({ message: 'Failed to upload photo.' });
    }
  });

  app.get("/api/photos/wedding/:weddingId", async (req, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);
      const photos = await storage.getPhotosByWeddingId(weddingId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePhoto(id);

      if (!deleted) {
        return res.status(404).json({ message: "Photo not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Guest book routes
  app.post("/api/guest-book", async (req, res) => {
    try {
      const entryData = insertGuestBookEntrySchema.parse(req.body);
      const entry = await storage.createGuestBookEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid guest book entry" });
    }
  });

  app.get("/api/guest-book/wedding/:weddingId", async (req, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);
      const entries = await storage.getGuestBookEntriesByWeddingId(weddingId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete guest book entry (admin only)
  app.delete("/api/guest-book/:entryId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log('Delete guest book entry request:', req.params.entryId);
      console.log('User making request:', (req as any).user);

      const entryId = parseInt(req.params.entryId);
      const deleted = await storage.deleteGuestBookEntry(entryId);

      console.log('Delete result:', deleted);

      if (!deleted) {
        return res.status(404).json({ message: "Guest book entry not found" });
      }

      res.json({ message: "Guest book entry deleted successfully" });
    } catch (error) {
      console.error('Delete guest book entry error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete guest book entry (guest manager - can only delete from their own weddings)
  app.delete("/api/guest-manager/guest-book/:entryId", authenticateToken, async (req, res) => {
    try {
      console.log('Guest manager delete request:', req.params.entryId);
      console.log('User making request:', (req as any).user);

      const entryId = parseInt(req.params.entryId);
      const userId = (req as any).user.userId;

      // Get the guest book entry - we need to find it by ID
      // First, let's get all guest book entries and find the one we want
      const allEntries = await storage.getAllGuestBookEntries();
      const entry = allEntries.find((e: any) => e.id === entryId);

      if (!entry) {
        return res.status(404).json({ message: "Guest book entry not found" });
      }

      // Check if user owns the wedding or is a guest manager for this wedding
      const wedding = await storage.getWeddingById(entry.weddingId);
      if (!wedding) {
        return res.status(404).json({ message: "Wedding not found" });
      }

      // Check if user is the wedding owner or has guest manager access
      if (wedding.userId !== userId) {
        // Check if user has guest manager access to this wedding
        const user = await storage.getUserById(userId);
        if (!user || user.role !== 'guest_manager') {
          return res.status(403).json({ message: "Access denied" });
        }

        // Additional check: verify guest manager has access to this specific wedding
        // This could be enhanced with a proper access control system
        const userWeddings = await storage.getWeddingsByUserId(userId);
        const hasAccess = userWeddings.some(w => w.id === entry.weddingId);

        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this wedding" });
        }
      }

      const deleted = await storage.deleteGuestBookEntry(entryId);

      if (!deleted) {
        return res.status(404).json({ message: "Guest book entry not found" });
      }

      res.json({ message: "Guest book entry deleted successfully" });
    } catch (error) {
      console.error('Guest manager delete error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Stats route
  app.get("/api/weddings/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await storage.getWeddingStats(id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Invitation routes for collaborative guest management
  app.post("/api/invitations", async (req, res) => {
    try {
      const invitationData = insertInvitationSchema.parse(req.body);
      const invitation = await storage.createInvitation(invitationData);
      res.status(201).json(invitation);
    } catch (error) {
      res.status(400).json({ message: "Invalid invitation data" });
    }
  });

  app.get("/api/invitations/wedding/:weddingId", async (req, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);
      const invitations = await storage.getInvitationsByWeddingId(weddingId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/invitations/guest/:guestId", async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const invitations = await storage.getInvitationsByGuestId(guestId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/invitations/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, errorMessage } = req.body;
      const invitation = await storage.updateInvitationStatus(id, status, errorMessage);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      res.json(invitation);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/invitations/:id/reminder", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sent = await storage.sendInvitationReminder(id);

      if (!sent) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      res.json({ message: "Reminder sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Guest collaborator routes for team management
  app.post("/api/collaborators", async (req, res) => {
    try {
      const collaboratorData = insertGuestCollaboratorSchema.parse(req.body);
      const collaborator = await storage.createGuestCollaborator(collaboratorData);
      res.status(201).json(collaborator);
    } catch (error) {
      res.status(400).json({ message: "Invalid collaborator data" });
    }
  });

  app.get("/api/collaborators/wedding/:weddingId", async (req, res) => {
    try {
      const weddingId = parseInt(req.params.weddingId);
      const collaborators = await storage.getCollaboratorsByWeddingId(weddingId);
      res.json(collaborators);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/collaborators/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const collaborator = await storage.updateCollaboratorStatus(id, status);

      if (!collaborator) {
        return res.status(404).json({ message: "Collaborator not found" });
      }

      res.json(collaborator);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/collaborators/accept", async (req, res) => {
    try {
      const { email, weddingId } = req.body;
      const collaborator = await storage.acceptCollaboratorInvite(email, weddingId);

      if (!collaborator) {
        return res.status(404).json({ message: "Collaborator invitation not found" });
      }

      res.json(collaborator);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.use('/api/payments', paymentsRouter);

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  // Use noServer:true so the ws library does NOT consume all HTTP upgrade events.
  // With { server, path }, ws destroys any upgrade request not matching the path
  // (including Vite HMR's /?token=... connections). Instead we manually route upgrades.
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(request, socket as any, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // All other paths (e.g. Vite HMR /?token=...) are left for Vite's own upgrade listener
  });

  // Store active connections by wedding ID
  const weddingConnections = new Map<number, Set<WebSocket>>();

  wss.on('connection', (ws, request) => {
    console.log('WebSocket connection established');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'join_wedding' && message.weddingId) {
          const weddingId = parseInt(message.weddingId);

          if (!weddingConnections.has(weddingId)) {
            weddingConnections.set(weddingId, new Set());
          }

          weddingConnections.get(weddingId)!.add(ws);
          console.log(`Client joined wedding ${weddingId}`);

          // Send confirmation
          ws.send(JSON.stringify({
            type: 'joined',
            weddingId: weddingId
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection from all wedding rooms
      weddingConnections.forEach((connections, weddingId) => {
        connections.delete(ws);
        if (connections.size === 0) {
          weddingConnections.delete(weddingId);
        }
      });
    });
  });

  // Function to broadcast updates to wedding subscribers
  function broadcastToWedding(weddingId: number, data: any) {
    const connections = weddingConnections.get(weddingId);
    if (connections) {
      const message = JSON.stringify(data);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  // Store broadcast function globally for use in routes
  (global as any).broadcastToWedding = broadcastToWedding;

  return httpServer;
}