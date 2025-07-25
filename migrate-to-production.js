#!/usr/bin/env node

/**
 * Migration Script: Local SQLite to Production PostgreSQL
 * This script helps migrate your local wedding data to production
 */

const sqlite3 = require('better-sqlite3');
const { Pool } = require('pg');

// Local SQLite database
const localDb = sqlite3('./wedding.db');

// Production PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_GcBtyjoP4u1C@ep-muddy-frost-ae6xe1ep.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
});

async function migrateData() {
  try {
    console.log('🔄 Starting migration from local SQLite to production PostgreSQL...');
    
    // Get users from local database
    const localUsers = localDb.prepare('SELECT * FROM users').all();
    console.log(`📊 Found ${localUsers.length} users in local database`);
    
    // Get weddings from local database
    const localWeddings = localDb.prepare('SELECT * FROM weddings').all();
    console.log(`💒 Found ${localWeddings.length} weddings in local database`);
    
    // Get guests from local database
    const localGuests = localDb.prepare('SELECT * FROM guests').all();
    console.log(`👥 Found ${localGuests.length} guests in local database`);
    
    // Get photos from local database
    const localPhotos = localDb.prepare('SELECT * FROM photos').all();
    console.log(`📸 Found ${localPhotos.length} photos in local database`);
    
    // Get guest book entries from local database
    const localGuestBook = localDb.prepare('SELECT * FROM guest_book_entries').all();
    console.log(`📝 Found ${localGuestBook.length} guest book entries in local database`);
    
    console.log('\n📋 Summary of local data:');
    console.log(`- Users: ${localUsers.length}`);
    console.log(`- Weddings: ${localWeddings.length}`);
    console.log(`- Guests: ${localGuests.length}`);
    console.log(`- Photos: ${localPhotos.length}`);
    console.log(`- Guest Book Entries: ${localGuestBook.length}`);
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('This script shows you what data you have locally.');
    console.log('To migrate to production, you need to:');
    console.log('1. Create users manually in production admin dashboard');
    console.log('2. Create weddings manually in production admin dashboard');
    console.log('3. Upload photos and music through the production interface');
    console.log('4. Add guests through the production guest management system');
    
    console.log('\n🎯 Recommended approach:');
    console.log('- Use the production admin dashboard to create test data');
    console.log('- This ensures data integrity and proper relationships');
    console.log('- Your local data is safe and can be used as reference');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    localDb.close();
    await pool.end();
  }
}

// Run migration
migrateData(); 