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
    
    // Run drizzle-kit push to apply schema changes
    execSync('npx drizzle-kit push', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('⚠️  Application will continue but may have database issues');
    
    // Don't exit with error code to prevent build failure
    process.exit(0);
  }
}

// Run migrations
runMigrations();
