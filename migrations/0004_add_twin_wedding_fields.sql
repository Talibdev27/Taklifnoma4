-- Twin / double-wedding mode: two couples celebrating at the same time & venue.
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "is_twin_wedding" boolean NOT NULL DEFAULT false;
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "bride2" varchar(255);
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "groom2" varchar(255);
