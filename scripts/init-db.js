#!/usr/bin/env node

import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

async function initializeDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL || !DATABASE_URL.startsWith('postgres')) {
    console.log('❌ No PostgreSQL DATABASE_URL found. Skipping initialization.');
    console.log('ℹ️  Set DATABASE_URL environment variable to initialize PostgreSQL database.');
    return;
  }

  try {
    console.log('🔄 Initializing PostgreSQL database...');
    
    // Create connection pool
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    client.release();
    
    if (result.rows.length === 0) {
      console.log('⚠️  Database tables not found. Please run: npm run db:push');
      console.log('ℹ️  This will create all necessary tables from your schema.');
    } else {
      console.log('✅ Database tables found');
    }
    
    await pool.end();
    console.log('✅ Database initialization complete');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase(); 