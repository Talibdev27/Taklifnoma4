#!/usr/bin/env node

import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigrations() {
  console.log('🔄 Starting post-build database migrations...');
  
  try {
    // Check if we're in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏭️  Skipping migrations in non-production environment');
      return;
    }

    // Check if we have database connection details
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not found, skipping migrations');
      return;
    }

    console.log('🔗 Connecting to production database...');
    console.log('📦 Applying schema changes with drizzle-kit push...');

    // Run drizzle-kit push to apply schema changes.
    // --force is REQUIRED in CI: without a TTY, drizzle-kit's interactive
    // confirmation prompt fails, leaving the production schema stale while the
    // build "succeeds" — exactly what causes inserts to 500 after deploy.
    execSync('npx drizzle-kit push --force', {
      stdio: 'inherit',
      env: { ...process.env }
    });

    console.log('✅ Database schema updated successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    // Fail the build loudly. Shipping new code against a stale schema silently
    // breaks the app (e.g. "column does not exist" 500s). Better to surface it.
    process.exit(1);
  }
}

// Run migrations
runMigrations();
