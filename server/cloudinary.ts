import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage for images
export const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wedding-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto' }
    ],
  } as any,
});

// Configure storage for audio files
export const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wedding-music',
    resource_type: 'video', // Cloudinary treats audio as video
    // No allowed_formats here: the multer fileFilter already restricts types,
    // and allowed_formats combined with resource_type 'video' can cause opaque
    // upload rejections for valid audio files.
  } as any,
});

// Accept audio by MIME type OR by file extension. Browsers are inconsistent
// about audio MIME types (an mp3 may arrive as application/octet-stream), so an
// extension fallback avoids spurious "Invalid file type" 500s on upload.
const AUDIO_MIME = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/mp4', 'video/mp4', 'application/octet-stream'];
const AUDIO_EXT = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.mp4'];
const isAudio = (file: any) =>
  AUDIO_MIME.includes(file.mimetype) ||
  AUDIO_EXT.some((ext) => (file.originalname || '').toLowerCase().endsWith(ext));

// Multer upload for images
export const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

// Multer upload for audio
export const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter: (req, file, cb) => {
    if (isAudio(file)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files (MP3, WAV, OGG, M4A, AAC, MP4) are allowed.'));
    }
  },
});

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// Helper function to get public ID from URL
export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

export default cloudinary; 