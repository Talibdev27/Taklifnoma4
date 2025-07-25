# Environment Variables Template

## Required for Cloudinary Integration

Add these to your `.env` file:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## How to Get Cloudinary Credentials:

1. **Sign up at Cloudinary**: https://cloudinary.com/
2. **Go to Dashboard**: After signing up, you'll see your credentials
3. **Copy the values**:
   - Cloud Name
   - API Key  
   - API Secret

## For Render Deployment:

Add these environment variables in your Render dashboard:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Fallback Behavior:

If Cloudinary is not configured, the app will automatically fallback to local file storage.

## Testing:

After setting up Cloudinary:
1. Upload a photo through your admin dashboard
2. Check that the URL starts with `https://res.cloudinary.com/`
3. Verify the photo loads correctly 