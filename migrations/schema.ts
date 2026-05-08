import { pgTable, foreignKey, serial, integer, varchar, text, timestamp, json, boolean, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const guestBookEntries = pgTable("guest_book_entries", {
	id: serial().primaryKey().notNull(),
	weddingId: integer("wedding_id").notNull(),
	guestName: varchar("guest_name", { length: 255 }).notNull(),
	message: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.weddingId],
			foreignColumns: [weddings.id],
			name: "guest_book_entries_wedding_id_weddings_id_fk"
		}),
]);

export const guestCollaborators = pgTable("guest_collaborators", {
	id: serial().primaryKey().notNull(),
	weddingId: integer("wedding_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).default('guest_manager').notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	invitedAt: timestamp("invited_at", { mode: 'string' }).defaultNow().notNull(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	permissions: json().default({"canEditDetails":false,"canManageGuests":true,"canViewAnalytics":true,"canManagePhotos":false,"canEditGuestBook":false}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.weddingId],
			foreignColumns: [weddings.id],
			name: "guest_collaborators_wedding_id_weddings_id_fk"
		}),
]);

export const guests = pgTable("guests", {
	id: serial().primaryKey().notNull(),
	weddingId: integer("wedding_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	rsvpStatus: varchar("rsvp_status", { length: 50 }).default('pending').notNull(),
	responseText: text("response_text"),
	plusOne: boolean("plus_one").default(false).notNull(),
	plusOneName: varchar("plus_one_name", { length: 255 }),
	additionalGuests: integer("additional_guests").default(0).notNull(),
	message: text(),
	category: varchar({ length: 100 }).default('family').notNull(),
	side: varchar({ length: 20 }).default('both').notNull(),
	dietaryRestrictions: text("dietary_restrictions"),
	address: text(),
	invitationSent: boolean("invitation_sent").default(false).notNull(),
	invitationSentAt: timestamp("invitation_sent_at", { mode: 'string' }),
	addedBy: varchar("added_by", { length: 50 }).default('couple').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.weddingId],
			foreignColumns: [weddings.id],
			name: "guests_wedding_id_weddings_id_fk"
		}),
]);

export const invitations = pgTable("invitations", {
	id: serial().primaryKey().notNull(),
	weddingId: integer("wedding_id").notNull(),
	guestId: integer("guest_id").notNull(),
	invitationType: varchar("invitation_type", { length: 50 }).default('email').notNull(),
	recipientContact: varchar("recipient_contact", { length: 255 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	openedAt: timestamp("opened_at", { mode: 'string' }),
	errorMessage: text("error_message"),
	reminderSentAt: timestamp("reminder_sent_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.weddingId],
			foreignColumns: [weddings.id],
			name: "invitations_wedding_id_weddings_id_fk"
		}),
	foreignKey({
			columns: [table.guestId],
			foreignColumns: [guests.id],
			name: "invitations_guest_id_guests_id_fk"
		}),
]);

export const milestones = pgTable("milestones", {
	id: serial().primaryKey().notNull(),
	weddingId: integer("wedding_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	isCompleted: boolean("is_completed").default(false).notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	priority: varchar({ length: 20 }).default('medium').notNull(),
	assignedTo: varchar("assigned_to", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.weddingId],
			foreignColumns: [weddings.id],
			name: "milestones_wedding_id_weddings_id_fk"
		}),
]);

export const photos = pgTable("photos", {
	id: serial().primaryKey().notNull(),
	weddingId: integer("wedding_id").notNull(),
	url: text().notNull(),
	caption: text(),
	isHero: boolean("is_hero").default(false).notNull(),
	photoType: varchar("photo_type", { length: 50 }).default('memory').notNull(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.weddingId],
			foreignColumns: [weddings.id],
			name: "photos_wedding_id_weddings_id_fk"
		}),
]);

export const budgetCategories = pgTable("budget_categories", {
	id: serial().primaryKey().notNull(),
	weddingId: integer("wedding_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	budgetAmount: integer("budget_amount").default(0).notNull(),
	spentAmount: integer("spent_amount").default(0).notNull(),
	isArchived: boolean("is_archived").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.weddingId],
			foreignColumns: [weddings.id],
			name: "budget_categories_wedding_id_weddings_id_fk"
		}),
]);

export const budgetItems = pgTable("budget_items", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id").notNull(),
	weddingId: integer("wedding_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	estimatedCost: integer("estimated_cost").default(0).notNull(),
	actualCost: integer("actual_cost").default(0).notNull(),
	vendor: varchar({ length: 255 }),
	notes: text(),
	isPaid: boolean("is_paid").default(false).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [budgetCategories.id],
			name: "budget_items_category_id_budget_categories_id_fk"
		}),
	foreignKey({
			columns: [table.weddingId],
			foreignColumns: [weddings.id],
			name: "budget_items_wedding_id_weddings_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	isAdmin: boolean("is_admin").default(false).notNull(),
	role: varchar({ length: 50 }).default('user').notNull(),
	hasPaidSubscription: boolean("has_paid_subscription").default(false).notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentOrderId: varchar("payment_order_id", { length: 255 }),
	paymentDate: timestamp("payment_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const weddings = pgTable("weddings", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	uniqueUrl: varchar("unique_url", { length: 255 }).notNull(),
	bride: varchar({ length: 255 }).notNull(),
	groom: varchar({ length: 255 }).notNull(),
	weddingDate: timestamp("wedding_date", { mode: 'string' }).notNull(),
	weddingTime: varchar("wedding_time", { length: 50 }).default('4:00 PM').notNull(),
	timezone: varchar({ length: 100 }).default('Asia/Tashkent').notNull(),
	venue: varchar({ length: 500 }).notNull(),
	venueAddress: text("venue_address").notNull(),
	venueCoordinates: json("venue_coordinates"),
	mapPinUrl: text("map_pin_url"),
	story: text(),
	welcomeMessage: text("welcome_message"),
	dearGuestMessage: text("dear_guest_message"),
	couplePhotoUrl: text("couple_photo_url"),
	backgroundTemplate: varchar("background_template", { length: 100 }).default('template1'),
	template: varchar({ length: 100 }).default('garden-romance').notNull(),
	primaryColor: varchar("primary_color", { length: 20 }).default('#D4B08C').notNull(),
	accentColor: varchar("accent_color", { length: 20 }).default('#89916B').notNull(),
	backgroundMusicUrl: text("background_music_url"),
	dressCode: text("dress_code"),
	isPublic: boolean("is_public").default(true).notNull(),
	availableLanguages: json("available_languages").default(["en"]).notNull(),
	defaultLanguage: varchar("default_language", { length: 10 }).default('en').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	age: varchar({ length: 50 }),
	partyTheme: text("party_theme"),
	rsvpDeadline: timestamp("rsvp_deadline", { mode: 'string' }),
	giftRegistryInfo: text("gift_registry_info"),
	contactPerson: text("contact_person"),
	specialInstructions: text("special_instructions"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "weddings_user_id_users_id_fk"
		}),
	unique("weddings_unique_url_unique").on(table.uniqueUrl),
]);

export const weddingAccess = pgTable("wedding_access", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	weddingId: integer("wedding_id").notNull(),
	accessLevel: varchar("access_level", { length: 50 }).default('viewer').notNull(),
	permissions: json().default({"canEditDetails":false,"canManageGuests":false,"canViewAnalytics":false,"canManagePhotos":false,"canEditGuestBook":false}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wedding_access_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.weddingId],
			foreignColumns: [weddings.id],
			name: "wedding_access_wedding_id_weddings_id_fk"
		}),
]);
