#!/usr/bin/env node

import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

async function testConnection() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.log('❌ No DATABASE_URL environment variable found');
    return;
  }

  console.log('🔗 Testing connection to:', DATABASE_URL.replace(/:[^:@]*@/, ':***@'));
  
  try {
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    console.log('🔄 Attempting to connect...');
    const client = await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('🕐 Current time:', result.rows[0].current_time);
    console.log('🗃️  Database version:', result.rows[0].db_version.split(' ')[0]);
    
    client.release();
    await pool.end();
    
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      severity: error.severity,
      detail: error.detail
    });
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your Neon dashboard for the correct connection string');
    console.log('2. Ensure the database is not sleeping (Neon free tier suspends after inactivity)');
    console.log('3. Verify the password doesn\'t contain special characters that need URL encoding');
    console.log('4. Try regenerating the database password in Neon console');
  }
}

testConnection(); 