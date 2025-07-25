PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE `budget_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wedding_id` integer NOT NULL,
	`name` text NOT NULL,
	`estimated_cost` integer NOT NULL,
	`actual_cost` integer DEFAULT 0 NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`wedding_id`) REFERENCES `weddings`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE `budget_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`estimated_cost` integer NOT NULL,
	`actual_cost` integer DEFAULT 0 NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	`vendor` text,
	`due_date` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `budget_categories`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE `guest_book_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wedding_id` integer NOT NULL,
	`guest_name` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`wedding_id`) REFERENCES `weddings`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE `guest_collaborators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wedding_id` integer NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`invited_at` integer NOT NULL,
	`accepted_at` integer,
	`last_active_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`wedding_id`) REFERENCES `weddings`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE `guests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wedding_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`rsvp_status` text DEFAULT 'pending' NOT NULL,
	`plus_one` integer DEFAULT false NOT NULL,
	`plus_one_name` text,
	`additional_guests` integer DEFAULT 0 NOT NULL,
	`message` text,
	`category` text DEFAULT 'family' NOT NULL,
	`side` text DEFAULT 'both' NOT NULL,
	`dietary_restrictions` text,
	`address` text,
	`invitation_sent` integer DEFAULT false NOT NULL,
	`invitation_sent_at` integer,
	`added_by` text DEFAULT 'couple' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`responded_at` integer, `response_text` text,
	FOREIGN KEY (`wedding_id`) REFERENCES `weddings`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO guests VALUES(6,2,'dfdf','','','confirmed',0,NULL,0,'dfdf','family','both','',NULL,0,NULL,'couple',NULL,1751051895,NULL,'Ha, albatta boraman!');
INSERT INTO guests VALUES(7,2,'nigora','','','maybe',0,NULL,0,'sasa','family','both','',NULL,0,NULL,'couple',NULL,1751053809,NULL,'🤔 Hali aniq emas');
INSERT INTO guests VALUES(14,3,'nigora','','','declined',0,NULL,0,'','family','both','',NULL,0,NULL,'couple',NULL,1751319587,NULL,NULL);
INSERT INTO guests VALUES(15,3,'doston','','','maybe',0,NULL,0,'sdsd','family','both','',NULL,0,NULL,'couple',NULL,1751319607,NULL,NULL);
INSERT INTO guests VALUES(16,3,'bmmbmb','','','confirmed',0,NULL,0,'vnvn','family','both','',NULL,0,NULL,'couple',NULL,1751319671,NULL,NULL);
INSERT INTO guests VALUES(17,3,'ukugbek','','','confirmed',0,NULL,0,'tabrik','family','both','',NULL,0,NULL,'couple',NULL,1751319754,NULL,NULL);
INSERT INTO guests VALUES(19,3,'nnvnv','','','confirmed',0,NULL,0,'vbv','family','both','',NULL,0,NULL,'couple',NULL,1751319808,NULL,NULL);
INSERT INTO guests VALUES(20,3,'nbnbn','','','confirmed',0,NULL,0,'bnnb','family','both','',NULL,0,NULL,'couple',NULL,1751319974,NULL,NULL);
CREATE TABLE `invitations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guest_id` integer NOT NULL,
	`wedding_id` integer NOT NULL,
	`invitation_type` text DEFAULT 'email' NOT NULL,
	`invitation_template` text DEFAULT 'classic' NOT NULL,
	`sent_at` integer,
	`delivered_at` integer,
	`opened_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`error_message` text,
	`reminder_sent_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wedding_id`) REFERENCES `weddings`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE `milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wedding_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`target_date` integer NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`celebration_message` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`wedding_id`) REFERENCES `weddings`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE `photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wedding_id` integer NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`is_hero` integer DEFAULT false NOT NULL,
	`photo_type` text DEFAULT 'memory' NOT NULL,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`wedding_id`) REFERENCES `weddings`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`has_paid_subscription` integer DEFAULT false NOT NULL,
	`payment_method` text,
	`payment_order_id` text,
	`payment_date` integer,
	`created_at` integer NOT NULL
);
INSERT INTO users VALUES(1,'admin@wedding-platform.com','admin-placeholder','System Administrator',1,'admin',1,NULL,NULL,NULL,1751041729);
INSERT INTO users VALUES(2,'xurshid@gmail.com','$2b$10$hE2XNX/eHr/jfXiYSYeNIe2VsUVr25xafVbfawgTBkQNP1cI4Q1OK','xurshid',0,'guest_manager',0,NULL,NULL,NULL,1751041897);
CREATE TABLE `wedding_access` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`wedding_id` integer NOT NULL,
	`access_level` text DEFAULT 'viewer' NOT NULL,
	`permissions` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wedding_id`) REFERENCES `weddings`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE `weddings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`unique_url` text NOT NULL,
	`bride` text NOT NULL,
	`groom` text NOT NULL,
	`wedding_date` integer NOT NULL,
	`wedding_time` text DEFAULT '4:00 PM' NOT NULL,
	`timezone` text DEFAULT 'Asia/Tashkent' NOT NULL,
	`venue` text NOT NULL,
	`venue_address` text NOT NULL,
	`venue_coordinates` text,
	`map_pin_url` text,
	`story` text,
	`welcome_message` text,
	`dear_guest_message` text,
	`couple_photo_url` text,
	`background_template` text DEFAULT 'template1',
	`template` text DEFAULT 'garden-romance' NOT NULL,
	`primary_color` text DEFAULT '#D4B08C' NOT NULL,
	`accent_color` text DEFAULT '#89916B' NOT NULL,
	`background_music_url` text,
	`is_public` integer DEFAULT true NOT NULL,
	`available_languages` text NOT NULL,
	`default_language` text DEFAULT 'en' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO weddings VALUES(2,2,'5wz9r4syc0d','Nigora','Aziz',1756080000,'4:00 PM','Asia/Tashkent','ns,dn,','smd,.m',NULL,NULL,'',NULL,'','/uploads/photo-YLJMZXYTGGf7bp8wvS5ko.png','template1','epic','#D4B08C','#89916B',NULL,1,'["en","ru","uz"]','uz',1751051728);
INSERT INTO weddings VALUES(3,2,'gjam6jkjv7v','Sora','Muhammadamin',1759104000,'17:00','Asia/Tashkent','Rohat restarani','Samarqand shahar',NULL,'https://g.co/kgs/hWmqETk','',NULL,replace('Sizni Bekzod va Sevaraning nikoh to''yining faxriy mehmoni bo''lishga taklif qilamiz.\nQalblar ezguliklarga to la bo''lgan ushbu qutlug'' kunda do''stlar yonida bo''ling!','\n',char(10)),'/uploads/photo-5alvGTZkTr41YVC5WcBBK.png','template1','epic','#3ba047','#3ba047',NULL,1,'["en","ru","uz"]','uz',1751312645);
INSERT INTO weddings VALUES(16,2,'dwlde1mx9w','abbos','nigore',1762819200,'4:00 PM','Asia/Tashkent','','',NULL,NULL,'',NULL,'',NULL,'template1','epic','#1976d2','#1565c0',NULL,1,'["en","ru","uz"]','ru',1751834783);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',2);
INSERT INTO sqlite_sequence VALUES('weddings',16);
INSERT INTO sqlite_sequence VALUES('guests',20);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE UNIQUE INDEX `weddings_unique_url_unique` ON `weddings` (`unique_url`);
COMMIT;
