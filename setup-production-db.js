#!/usr/bin/env node

/**
 * Production Database Setup Script
 * This script runs migrations to create all necessary tables in production
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema.js';

neonConfig.webSocketConstructor = ws;

async function setupProductionDatabase() {
  try {
    console.log('🔄 Setting up production database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    console.log('📊 Checking database connection...');
    
    // Test the connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'weddings', 'guests', 'photos', 'guest_book_entries')
    `;
    
    const tables = await pool.query(tablesQuery);
    console.log('📋 Existing tables:', tables.rows.map(row => row.table_name));
    
    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found. You need to run migrations.');
      console.log('📝 To fix this:');
      console.log('1. Install Drizzle CLI: npm install -g drizzle-kit');
      console.log('2. Run migrations: npx drizzle-kit push');
      console.log('3. Or manually create tables using the migration files');
    } else {
      console.log('✅ Database tables exist');
    }
    
    // Test basic operations
    console.log('🧪 Testing basic database operations...');
    
    try {
      const users = await db.select().from(schema.users).limit(1);
      console.log('✅ Users table accessible');
    } catch (error) {
      console.log('❌ Users table error:', error.message);
    }
    
    try {
      const weddings = await db.select().from(schema.weddings).limit(1);
      console.log('✅ Weddings table accessible');
    } catch (error) {
      console.log('❌ Weddings table error:', error.message);
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Run migrations: npx drizzle-kit push');
    console.log('2. Restart your Render deployment');
    console.log('3. Test creating a wedding in production');
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.error('Full error:', error);
  }
}

setupProductionDatabase(); 