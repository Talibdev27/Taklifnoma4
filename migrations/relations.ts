import { relations } from "drizzle-orm/relations";
import { weddings, guestBookEntries, guestCollaborators, guests, invitations, milestones, photos, budgetCategories, budgetItems, users, weddingAccess } from "./schema";

export const guestBookEntriesRelations = relations(guestBookEntries, ({one}) => ({
	wedding: one(weddings, {
		fields: [guestBookEntries.weddingId],
		references: [weddings.id]
	}),
}));

export const weddingsRelations = relations(weddings, ({one, many}) => ({
	guestBookEntries: many(guestBookEntries),
	guestCollaborators: many(guestCollaborators),
	guests: many(guests),
	invitations: many(invitations),
	milestones: many(milestones),
	photos: many(photos),
	budgetCategories: many(budgetCategories),
	budgetItems: many(budgetItems),
	user: one(users, {
		fields: [weddings.userId],
		references: [users.id]
	}),
	weddingAccesses: many(weddingAccess),
}));

export const guestCollaboratorsRelations = relations(guestCollaborators, ({one}) => ({
	wedding: one(weddings, {
		fields: [guestCollaborators.weddingId],
		references: [weddings.id]
	}),
}));

export const guestsRelations = relations(guests, ({one, many}) => ({
	wedding: one(weddings, {
		fields: [guests.weddingId],
		references: [weddings.id]
	}),
	invitations: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	wedding: one(weddings, {
		fields: [invitations.weddingId],
		references: [weddings.id]
	}),
	guest: one(guests, {
		fields: [invitations.guestId],
		references: [guests.id]
	}),
}));

export const milestonesRelations = relations(milestones, ({one}) => ({
	wedding: one(weddings, {
		fields: [milestones.weddingId],
		references: [weddings.id]
	}),
}));

export const photosRelations = relations(photos, ({one}) => ({
	wedding: one(weddings, {
		fields: [photos.weddingId],
		references: [weddings.id]
	}),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({one, many}) => ({
	wedding: one(weddings, {
		fields: [budgetCategories.weddingId],
		references: [weddings.id]
	}),
	budgetItems: many(budgetItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({one}) => ({
	budgetCategory: one(budgetCategories, {
		fields: [budgetItems.categoryId],
		references: [budgetCategories.id]
	}),
	wedding: one(weddings, {
		fields: [budgetItems.weddingId],
		references: [weddings.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	weddings: many(weddings),
	weddingAccesses: many(weddingAccess),
}));

export const weddingAccessRelations = relations(weddingAccess, ({one}) => ({
	user: one(users, {
		fields: [weddingAccess.userId],
		references: [users.id]
	}),
	wedding: one(weddings, {
		fields: [weddingAccess.weddingId],
		references: [weddings.id]
	}),
}));