-- To'yona (monetary gift) section: bank card details guests can send money to.
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "card_holder_name" varchar(255);
ALTER TABLE "weddings" ADD COLUMN IF NOT EXISTS "card_number" varchar(50);
