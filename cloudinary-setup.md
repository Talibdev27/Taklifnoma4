# Cloudinary Setup for Persistent Photo Storage

## Why Photos Disappear on Render
Render's file system is ephemeral - files get deleted on server restart. We need cloud storage.

## Solution: Cloudinary (Free Tier)

### Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com/
2. Sign up for free account
3. Get your credentials from Dashboard

### Step 2: Install Cloudinary
```bash
npm install cloudinary multer-storage-cloudinary
```

### Step 3: Update Environment Variables
Add to your `.env` file:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 4: Update Render Environment Variables
Add these to your Render dashboard:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY` 
- `CLOUDINARY_API_SECRET`

### Step 5: Update Upload Configuration
Replace local file storage with Cloudinary storage.

## Benefits:
✅ **Photos never disappear**
✅ **Automatic image optimization**
✅ **CDN for fast loading**
✅ **Free tier: 25GB storage, 25GB bandwidth**

## Alternative: AWS S3
If you prefer AWS S3, we can set that up instead.

## Migration Strategy:
1. Set up cloud storage
2. Update upload endpoints
3. Migrate existing photos (optional)
4. Test upload functionality

Would you like me to implement Cloudinary integration? 