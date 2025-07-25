#!/usr/bin/env node

/**
 * Fix Production Database Script
 * Adds missing dress_code column to weddings table
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function fixProductionDatabase() {
  try {
    console.log('🔧 Fixing production database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('📊 Checking current table structure...');
    
    // Check if dress_code column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'weddings' 
      AND column_name = 'dress_code'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ dress_code column is missing. Adding it...');
      
      // Add the missing column
      await pool.query(`
        ALTER TABLE weddings 
        ADD COLUMN dress_code TEXT
      `);
      
      console.log('✅ dress_code column added successfully!');
    } else {
      console.log('✅ dress_code column already exists');
    }
    
    // Verify the fix
    const verifyCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'weddings' 
      AND column_name = 'dress_code'
    `);
    
    if (verifyCheck.rows.length > 0) {
      console.log('✅ Verification successful: dress_code column is now available');
      console.log('📋 Column details:', verifyCheck.rows[0]);
    } else {
      console.log('❌ Verification failed: column still missing');
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Restart your Render deployment');
    console.log('2. Test creating a wedding in production');
    console.log('3. The 500 errors should be resolved');
    
  } catch (error) {
    console.error('❌ Database fix error:', error.message);
    console.error('Full error:', error);
  }
}

fixProductionDatabase(); 