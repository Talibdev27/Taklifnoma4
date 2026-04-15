-- Add admin approval field to weddings table
ALTER TABLE "weddings" ADD COLUMN "is_approved" boolean NOT NULL DEFAULT false;

-- Make existing weddings approved by default (for backward compatibility)
UPDATE "weddings" SET "is_approved" = true WHERE "is_approved" IS NULL OR "is_approved" = false;
