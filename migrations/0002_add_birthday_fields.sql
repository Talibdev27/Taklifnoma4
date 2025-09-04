-- Add birthday-specific fields to weddings table
ALTER TABLE "weddings" ADD COLUMN "age" varchar(50);
ALTER TABLE "weddings" ADD COLUMN "party_theme" text;
ALTER TABLE "weddings" ADD COLUMN "rsvp_deadline" timestamp;
ALTER TABLE "weddings" ADD COLUMN "gift_registry_info" text;
ALTER TABLE "weddings" ADD COLUMN "contact_person" text;
ALTER TABLE "weddings" ADD COLUMN "special_instructions" text;
