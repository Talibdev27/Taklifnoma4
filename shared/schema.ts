import { pgTable, text, integer, timestamp, boolean, json, serial, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  role: varchar("role", { length: 50 }).$type<"user" | "admin" | "guest_manager">().notNull().default("user"),
  hasPaidSubscription: boolean("has_paid_subscription").default(false).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentOrderId: varchar("payment_order_id", { length: 255 }),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const weddings = pgTable("weddings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  uniqueUrl: varchar("unique_url", { length: 255 }).notNull().unique(),
  bride: varchar("bride", { length: 255 }).notNull(),
  groom: varchar("groom", { length: 255 }).notNull(),
  weddingDate: timestamp("wedding_date").notNull(),
  weddingTime: varchar("wedding_time", { length: 50 }).notNull().default("4:00 PM"),
  timezone: varchar("timezone", { length: 100 }).notNull().default("Asia/Tashkent"),
  venue: varchar("venue", { length: 500 }).notNull(),
  venueAddress: text("venue_address").notNull(),
  venueCoordinates: json("venue_coordinates").$type<{ lat: number; lng: number }>(),
  mapPinUrl: text("map_pin_url"),
  story: text("story"),
  welcomeMessage: text("welcome_message"),
  dearGuestMessage: text("dear_guest_message"),
  couplePhotoUrl: text("couple_photo_url"),
  backgroundTemplate: varchar("background_template", { length: 100 }).default("template1"),
  template: varchar("template", { length: 100 }).notNull().default("garden-romance"),
  primaryColor: varchar("primary_color", { length: 20 }).notNull().default("#D4B08C"),
  accentColor: varchar("accent_color", { length: 20 }).notNull().default("#89916B"),
  backgroundMusicUrl: text("background_music_url"),
  dressCode: text("dress_code"),
  isPublic: boolean("is_public").notNull().default(true),
  availableLanguages: json("available_languages").$type<string[]>().notNull().default(['en']),
  defaultLanguage: varchar("default_language", { length: 10 }).notNull().default("en"),
  // Birthday-specific fields
  age: varchar("age", { length: 50 }),
  partyTheme: text("party_theme"),
  rsvpDeadline: timestamp("rsvp_deadline"),
  giftRegistryInfo: text("gift_registry_info"),
  contactPerson: text("contact_person"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const guests = pgTable("guests", {
  id: serial("id").primaryKey(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  rsvpStatus: varchar("rsvp_status", { length: 50 }).$type<"pending" | "confirmed" | "confirmed_with_guest" | "declined" | "maybe">().notNull().default("pending"),
  responseText: text("response_text"),
  plusOne: boolean("plus_one").notNull().default(false),
  plusOneName: varchar("plus_one_name", { length: 255 }),
  additionalGuests: integer("additional_guests").notNull().default(0),
  message: text("message"),
  category: varchar("category", { length: 100 }).notNull().default("family"),
  side: varchar("side", { length: 20 }).$type<"bride" | "groom" | "both">().notNull().default("both"),
  dietaryRestrictions: text("dietary_restrictions"),
  address: text("address"),
  invitationSent: boolean("invitation_sent").notNull().default(false),
  invitationSentAt: timestamp("invitation_sent_at"),
  addedBy: varchar("added_by", { length: 50 }).notNull().default("couple"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  isHero: boolean("is_hero").notNull().default(false),
  photoType: varchar("photo_type", { length: 50 }).$type<"couple" | "memory" | "hero">().notNull().default("memory"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const guestBookEntries = pgTable("guest_book_entries", {
  id: serial("id").primaryKey(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  guestName: varchar("guest_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  budgetAmount: integer("budget_amount").notNull().default(0),
  spentAmount: integer("spent_amount").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => budgetCategories.id).notNull(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  estimatedCost: integer("estimated_cost").notNull().default(0),
  actualCost: integer("actual_cost").notNull().default(0),
  vendor: varchar("vendor", { length: 255 }),
  notes: text("notes"),
  isPaid: boolean("is_paid").notNull().default(false),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  guestId: integer("guest_id").references(() => guests.id).notNull(),
  invitationType: varchar("invitation_type", { length: 50 }).notNull().default("email"),
  recipientContact: varchar("recipient_contact", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  errorMessage: text("error_message"),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const guestCollaborators = pgTable("guest_collaborators", {
  id: serial("id").primaryKey(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("guest_manager"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  permissions: json("permissions").$type<{
    canEditDetails: boolean;
    canManageGuests: boolean;
    canViewAnalytics: boolean;
    canManagePhotos: boolean;
    canEditGuestBook: boolean;
  }>().notNull().default({
    canEditDetails: false,
    canManageGuests: true,
    canViewAnalytics: true,
    canManagePhotos: false,
    canEditGuestBook: false
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const weddingAccess = pgTable("wedding_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  accessLevel: varchar("access_level", { length: 50 }).$type<"owner" | "guest_manager" | "viewer">().notNull().default("viewer"),
  permissions: json("permissions").$type<{
    canEditDetails: boolean;
    canManageGuests: boolean;
    canViewAnalytics: boolean;
    canManagePhotos: boolean;
    canEditGuestBook: boolean;
  }>().notNull().default({
    canEditDetails: false,
    canManageGuests: false,
    canViewAnalytics: false,
    canManagePhotos: false,
    canEditGuestBook: false
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  weddings: many(weddings),
  weddingAccess: many(weddingAccess),
}));

export const weddingsRelations = relations(weddings, ({ one, many }) => ({
  user: one(users, {
    fields: [weddings.userId],
    references: [users.id],
  }),
  guests: many(guests),
  photos: many(photos),
  guestBookEntries: many(guestBookEntries),
  budgetCategories: many(budgetCategories),
  budgetItems: many(budgetItems),
  milestones: many(milestones),
  invitations: many(invitations),
  guestCollaborators: many(guestCollaborators),
  weddingAccess: many(weddingAccess),
}));

export const guestsRelations = relations(guests, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [guests.weddingId],
    references: [weddings.id],
  }),
  invitations: many(invitations),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  wedding: one(weddings, {
    fields: [photos.weddingId],
    references: [weddings.id],
  }),
}));

export const guestBookEntriesRelations = relations(guestBookEntries, ({ one }) => ({
  wedding: one(weddings, {
    fields: [guestBookEntries.weddingId],
    references: [weddings.id],
  }),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [budgetCategories.weddingId],
    references: [weddings.id],
  }),
  budgetItems: many(budgetItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  category: one(budgetCategories, {
    fields: [budgetItems.categoryId],
    references: [budgetCategories.id],
  }),
  wedding: one(weddings, {
    fields: [budgetItems.weddingId],
    references: [weddings.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  wedding: one(weddings, {
    fields: [milestones.weddingId],
    references: [weddings.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  wedding: one(weddings, {
    fields: [invitations.weddingId],
    references: [weddings.id],
  }),
  guest: one(guests, {
    fields: [invitations.guestId],
    references: [guests.id],
  }),
}));

export const guestCollaboratorsRelations = relations(guestCollaborators, ({ one }) => ({
  wedding: one(weddings, {
    fields: [guestCollaborators.weddingId],
    references: [weddings.id],
  }),
}));

export const weddingAccessRelations = relations(weddingAccess, ({ one }) => ({
  user: one(users, {
    fields: [weddingAccess.userId],
    references: [users.id],
  }),
  wedding: one(weddings, {
    fields: [weddingAccess.weddingId],
    references: [weddings.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWeddingSchema = createInsertSchema(weddings).omit({
  id: true,
  createdAt: true,
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  uploadedAt: true,
});

export const insertGuestBookEntrySchema = createInsertSchema(guestBookEntries).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  reminderSentAt: true,
});

export const insertGuestCollaboratorSchema = createInsertSchema(guestCollaborators).omit({
  id: true,
  createdAt: true,
  invitedAt: true,
  acceptedAt: true,
});

export const insertWeddingAccessSchema = createInsertSchema(weddingAccess).omit({
  id: true,
  createdAt: true,
});

export const rsvpUpdateSchema = z.object({
  rsvpStatus: z.enum(["pending", "confirmed", "confirmed_with_guest", "declined", "maybe"]),
  responseText: z.string().optional(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().optional(),
  additionalGuests: z.number().int().min(0).optional(),
  message: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Wedding = typeof weddings.$inferSelect;
export type InsertWedding = z.infer<typeof insertWeddingSchema>;

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type GuestBookEntry = typeof guestBookEntries.$inferSelect;
export type InsertGuestBookEntry = z.infer<typeof insertGuestBookEntrySchema>;

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;

export type GuestCollaborator = typeof guestCollaborators.$inferSelect;
export type InsertGuestCollaborator = z.infer<typeof insertGuestCollaboratorSchema>;

export type WeddingAccess = typeof weddingAccess.$inferSelect;
export type InsertWeddingAccess = z.infer<typeof insertWeddingAccessSchema>;

export type RSVPUpdate = z.infer<typeof rsvpUpdateSchema>;