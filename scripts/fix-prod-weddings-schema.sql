-- Immediate, idempotent fix for the production "create wedding -> 500" error.
-- Cause: the production `weddings` table is missing columns that the current
-- code inserts/returns (the 0002 birthday + 0003 approval migrations and the
-- event_type / rsvp_mode / language columns were never applied to prod).
--
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS is a no-op if present).
-- Run against the Render production database, e.g.:
--   psql "$DATABASE_URL" -f scripts/fix-prod-weddings-schema.sql

ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "event_type"        varchar(50)  NOT NULL DEFAULT 'wedding';
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "wedding_time"      varchar(50)  NOT NULL DEFAULT '4:00 PM';
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "timezone"          varchar(100) NOT NULL DEFAULT 'Asia/Tashkent';
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "venue_coordinates" json;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "map_pin_url"       text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "welcome_message"   text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "dear_guest_message" text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "couple_photo_url"  text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "background_template" varchar(100) DEFAULT 'template1';
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "background_music_url" text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "dress_code"        text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "is_approved"       boolean      NOT NULL DEFAULT false;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "available_languages" json       NOT NULL DEFAULT '["en"]';
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "default_language"  varchar(10)  NOT NULL DEFAULT 'en';
-- Birthday-specific fields (migration 0002)
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "age"               varchar(50);
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "party_theme"       text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "rsvp_deadline"     timestamp;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "gift_registry_info" text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "contact_person"   text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "special_instructions" text;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "rsvp_mode"         varchar(50)  NOT NULL DEFAULT 'both';

-- Existing rows created before approval existed should remain visible.
UPDATE "weddings" SET "is_approved" = true WHERE "is_approved" = false;
