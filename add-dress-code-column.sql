-- Add missing dress_code column to weddings table
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code TEXT; 