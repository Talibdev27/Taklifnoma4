# Render Deployment Guide

## Preventing Data Visibility Issues After Deployment

### The Problem
When you deploy new code to Render, if the database schema has changed, the new code might not be able to read existing data properly, making it appear "invisible."

### Solution 1: Automatic Post-Build Migrations (Recommended)

We've added a `postbuild` script that automatically runs database migrations after each build:

1. **The script runs automatically** after `npm run build`
2. **It only runs in production** (NODE_ENV=production)
3. **It uses drizzle-kit push** to apply schema changes
4. **It's safe** - won't break the build if migrations fail

### Solution 2: Manual Migration via Render Shell

If automatic migrations don't work, you can run them manually:

1. Go to your Render dashboard
2. Click on your web service
3. Go to the "Shell" tab
4. Run: `npx drizzle-kit push`

### Solution 3: Force Rebuild with Migrations

If you're still having issues:

1. **Trigger a new deployment** in Render
2. **Check the build logs** for migration messages
3. **Look for**: "✅ Database schema updated successfully!"

### Environment Variables Required

Make sure these are set in your Render environment:

```bash
NODE_ENV=production
DATABASE_URL=your_postgres_connection_string
```

### Troubleshooting

#### Data Still Not Visible?
1. Check if migrations ran successfully in build logs
2. Verify DATABASE_URL is correct
3. Check if the new schema fields exist in your database

#### Migration Failed?
1. Check the build logs for error messages
2. Verify database connection
3. Check if drizzle-kit is in your dependencies

#### Rollback Needed?
1. Revert to previous commit in Render
2. Or manually run: `npx drizzle-kit push` in Render shell

### Best Practices

1. **Always test migrations locally** before deploying
2. **Use the postbuild script** for automatic migrations
3. **Monitor build logs** for migration status
4. **Keep database schema in sync** with code changes

### Current Status

✅ **Post-build migration script added**
✅ **Package.json updated with postbuild hook**
✅ **Automatic schema updates on deployment**

Your next deployment should automatically apply the birthday field schema changes!
