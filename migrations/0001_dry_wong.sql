ALTER TABLE "budget_categories" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "budget_items" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "budget_items" ALTER COLUMN "estimated_cost" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "budget_items" ALTER COLUMN "vendor" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "guest_book_entries" ALTER COLUMN "guest_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "guest_collaborators" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "guest_collaborators" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "guest_collaborators" ALTER COLUMN "role" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "guest_collaborators" ALTER COLUMN "role" SET DEFAULT 'guest_manager';--> statement-breakpoint
ALTER TABLE "guest_collaborators" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "phone" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "rsvp_status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "plus_one_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "category" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "side" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "added_by" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "invitation_type" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "milestones" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "photos" ALTER COLUMN "photo_type" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "payment_method" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "payment_order_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "wedding_access" ALTER COLUMN "access_level" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "wedding_access" ALTER COLUMN "permissions" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "wedding_access" ALTER COLUMN "permissions" SET DEFAULT '{"canEditDetails":false,"canManageGuests":false,"canViewAnalytics":false,"canManagePhotos":false,"canEditGuestBook":false}'::json;--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "unique_url" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "bride" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "groom" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "wedding_time" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "timezone" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "venue" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "venue_coordinates" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "background_template" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "template" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "primary_color" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "accent_color" SET DATA TYPE varchar(20);--> statement-breakpoint
-- ALTER TABLE "weddings" ALTER COLUMN "available_languages" DROP DEFAULT;--> statement-breakpoint
-- ALTER TABLE "weddings" ALTER COLUMN "available_languages" SET DATA TYPE json USING array_to_json(available_languages);--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "available_languages" SET DEFAULT '["en"]'::json;--> statement-breakpoint
ALTER TABLE "weddings" ALTER COLUMN "default_language" SET DATA TYPE varchar(10);--> statement-breakpoint
-- ALTER TABLE "budget_categories" ADD COLUMN "budget_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- ALTER TABLE "budget_categories" ADD COLUMN "spent_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- ALTER TABLE "budget_categories" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- ALTER TABLE "budget_items" ADD COLUMN "wedding_id" integer NOT NULL;--> statement-breakpoint
-- ALTER TABLE "guest_collaborators" ADD COLUMN "permissions" json DEFAULT '{"canEditDetails":false,"canManageGuests":true,"canViewAnalytics":true,"canManagePhotos":false,"canEditGuestBook":false}'::json NOT NULL;--> statement-breakpoint
-- ALTER TABLE "guest_collaborators" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
-- ALTER TABLE "guests" ADD COLUMN "response_text" text;--> statement-breakpoint
-- ALTER TABLE "invitations" ADD COLUMN "recipient_contact" varchar(255) NOT NULL;--> statement-breakpoint
-- ALTER TABLE "milestones" ADD COLUMN "due_date" timestamp NOT NULL;--> statement-breakpoint
-- ALTER TABLE "milestones" ADD COLUMN "priority" varchar(20) DEFAULT 'medium' NOT NULL;--> statement-breakpoint
-- ALTER TABLE "milestones" ADD COLUMN "assigned_to" varchar(255);--> statement-breakpoint
-- ALTER TABLE "weddings" ADD COLUMN "dress_code" text;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categories" DROP COLUMN "estimated_cost";--> statement-breakpoint
ALTER TABLE "budget_categories" DROP COLUMN "actual_cost";--> statement-breakpoint
ALTER TABLE "budget_categories" DROP COLUMN "is_paid";--> statement-breakpoint
ALTER TABLE "budget_categories" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "budget_categories" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "guest_collaborators" DROP COLUMN "last_active_at";--> statement-breakpoint
ALTER TABLE "invitations" DROP COLUMN "invitation_template";--> statement-breakpoint
ALTER TABLE "milestones" DROP COLUMN "target_date";--> statement-breakpoint
ALTER TABLE "milestones" DROP COLUMN "celebration_message";