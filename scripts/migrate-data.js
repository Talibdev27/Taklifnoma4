#!/usr/bin/env node

import 'dotenv/config';
import Database from 'better-sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

const LOCAL_DB_PATH = 'wedding.db';

async function exportLocalData() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    console.log('❌ Local SQLite database not found');
    return null;
  }

  console.log('📤 Exporting data from local SQLite database...');
  
  const sqlite = new Database(LOCAL_DB_PATH);
  
  const data = {
    users: sqlite.prepare('SELECT * FROM users').all(),
    weddings: sqlite.prepare('SELECT * FROM weddings').all(),
    guests: sqlite.prepare('SELECT * FROM guests').all(),
    photos: sqlite.prepare('SELECT * FROM photos').all(),
    guest_book_entries: sqlite.prepare('SELECT * FROM guest_book_entries').all(),
    timestamp: new Date().toISOString()
  };
  
  sqlite.close();
  
  console.log(`✅ Exported ${data.users.length} users, ${data.weddings.length} weddings, ${data.guests.length} guests`);
  
  return data;
}

async function importToPostgreSQL(data) {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL || !DATABASE_URL.startsWith('postgres')) {
    console.log('❌ No PostgreSQL DATABASE_URL found');
    return false;
  }

  console.log('📥 Importing data to PostgreSQL...');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM guest_book_entries');
    await client.query('DELETE FROM photos');
    await client.query('DELETE FROM guests');
    await client.query('DELETE FROM weddings');
    await client.query('DELETE FROM users WHERE email != $1', ['admin@wedding-platform.com']);
    
    // Import users
    console.log('👥 Importing users...');
    for (const user of data.users) {
      await client.query(`
        INSERT INTO users (id, email, password, name, is_admin, role, has_paid_subscription, payment_method, payment_order_id, payment_date, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (email) DO NOTHING
      `, [
        user.id, user.email, user.password, user.name, user.is_admin,
        user.role, user.has_paid_subscription, user.payment_method,
        user.payment_order_id, user.payment_date, user.created_at
      ]);
    }
    
    // Import weddings
    console.log('💒 Importing weddings...');
    for (const wedding of data.weddings) {
      await client.query(`
        INSERT INTO weddings (id, user_id, unique_url, bride, groom, wedding_date, wedding_time, timezone, venue, venue_address, venue_coordinates, map_pin_url, story, welcome_message, dear_guest_message, couple_photo_url, background_template, template, primary_color, accent_color, background_music_url, is_public, available_languages, default_language, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        ON CONFLICT (unique_url) DO NOTHING
      `, [
        wedding.id, wedding.user_id, wedding.unique_url, wedding.bride, wedding.groom,
        wedding.wedding_date, wedding.wedding_time, wedding.timezone, wedding.venue,
        wedding.venue_address, wedding.venue_coordinates, wedding.map_pin_url,
        wedding.story, wedding.welcome_message, wedding.dear_guest_message,
        wedding.couple_photo_url, wedding.background_template, wedding.template,
        wedding.primary_color, wedding.accent_color, wedding.background_music_url,
        wedding.is_public, wedding.available_languages, wedding.default_language, wedding.created_at
      ]);
    }
    
    // Import guests
    console.log('👨‍👩‍👧‍👦 Importing guests...');
    for (const guest of data.guests) {
      await client.query(`
        INSERT INTO guests (id, wedding_id, name, email, phone, rsvp_status, response_text, plus_one, plus_one_name, additional_guests, message, category, side, dietary_restrictions, address, invitation_sent, invitation_sent_at, added_by, notes, created_at, responded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [
        guest.id, guest.wedding_id, guest.name, guest.email, guest.phone,
        guest.rsvp_status, guest.response_text, guest.plus_one, guest.plus_one_name,
        guest.additional_guests, guest.message, guest.category, guest.side,
        guest.dietary_restrictions, guest.address, guest.invitation_sent,
        guest.invitation_sent_at, guest.added_by, guest.notes, guest.created_at, guest.responded_at
      ]);
    }
    
    // Import photos
    console.log('📸 Importing photos...');
    for (const photo of data.photos) {
      await client.query(`
        INSERT INTO photos (id, wedding_id, url, caption, is_hero, photo_type, uploaded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        photo.id, photo.wedding_id, photo.url, photo.caption,
        photo.is_hero, photo.photo_type, photo.uploaded_at
      ]);
    }
    
    // Import guest book entries
    console.log('📖 Importing guest book entries...');
    for (const entry of data.guest_book_entries) {
      await client.query(`
        INSERT INTO guest_book_entries (id, wedding_id, guest_name, message, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [entry.id, entry.wedding_id, entry.guest_name, entry.message, entry.created_at]);
    }
    
    await client.query('COMMIT');
    console.log('✅ Data migration completed successfully');
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function migrateData() {
  try {
    console.log('🚀 Starting data migration...');
    
    // Export from local SQLite
    const data = await exportLocalData();
    if (!data) {
      console.log('❌ No data to migrate');
      return;
    }
    
    // Save backup
    const backupPath = `backup-${Date.now()}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`💾 Data backed up to ${backupPath}`);
    
    // Import to PostgreSQL
    await importToPostgreSQL(data);
    
    console.log('🎉 Migration completed successfully!');
    console.log('🔍 Check your production website to verify data is present');
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

migrateData(); 