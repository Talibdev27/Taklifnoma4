import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

/**
 * Idempotent, self-healing schema check run at server startup.
 *
 * The production `weddings` table predates several columns the current code
 * inserts (event_type, rsvp_mode, language fields, the birthday fields, and
 * is_approved). When those columns are absent, INSERT ... RETURNING fails and
 * "create wedding" returns 500. `ADD COLUMN IF NOT EXISTS` is a no-op when the
 * column already exists, so this is safe to run on every boot and needs no
 * build-time migration step or NODE_ENV gating.
 */
const WEDDING_COLUMNS: string[] = [
  `"event_type" varchar(50) NOT NULL DEFAULT 'wedding'`,
  `"wedding_time" varchar(50) NOT NULL DEFAULT '4:00 PM'`,
  `"timezone" varchar(100) NOT NULL DEFAULT 'Asia/Tashkent'`,
  `"venue_coordinates" json`,
  `"map_pin_url" text`,
  `"welcome_message" text`,
  `"dear_guest_message" text`,
  `"couple_photo_url" text`,
  `"background_template" varchar(100) DEFAULT 'template1'`,
  `"background_music_url" text`,
  `"dress_code" text`,
  `"is_approved" boolean NOT NULL DEFAULT false`,
  `"available_languages" json NOT NULL DEFAULT '["en"]'`,
  `"default_language" varchar(10) NOT NULL DEFAULT 'en'`,
  `"age" varchar(50)`,
  `"party_theme" text`,
  `"rsvp_deadline" timestamp`,
  `"gift_registry_info" text`,
  `"contact_person" text`,
  `"special_instructions" text`,
  `"rsvp_mode" varchar(50) NOT NULL DEFAULT 'both'`,
  `"sections" json NOT NULL DEFAULT '{"blessing":true,"countdown":true,"schedule":true,"venue":true,"location":true,"rsvp":true,"guestBook":true}'`,
  `"is_twin_wedding" boolean NOT NULL DEFAULT false`,
  `"bride2" varchar(255)`,
  `"groom2" varchar(255)`,
  // To'yona (monetary gift) card details
  `"card_holder_name" varchar(255)`,
  `"card_number" varchar(50)`,
];

export async function ensureWeddingsSchema(): Promise<void> {
  for (const def of WEDDING_COLUMNS) {
    const sql = `ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS ${def}`;
    try {
      await pool.query(sql);
    } catch (err) {
      console.error(`[ensureWeddingsSchema] failed: ${sql} ->`, (err as Error).message);
    }
  }
  console.log('[ensureWeddingsSchema] weddings schema verified');
}