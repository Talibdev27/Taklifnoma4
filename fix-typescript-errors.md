# TypeScript Error Fix Guide for storage.ts

## Overview
There are 20 TypeScript errors in `server/storage.ts` that need to be fixed. These are primarily type compatibility issues between the database schema and the TypeScript types.

## Main Issues Identified

### 1. Wedding Creation Type Issues
**Problem**: Type mismatches in `createWedding` method
**Solution**: Ensure all required fields have proper defaults

### 2. Access Level Type Issues  
**Problem**: `accessLevel` property type incompatibilities
**Solution**: Use proper union types for access levels

### 3. Row Count Null Checks
**Problem**: `result.rowCount` can be null
**Solution**: Add proper null checks

### 4. Array Type Incompatibilities
**Problem**: `availableLanguages` array type issues
**Solution**: Ensure proper array typing

## Step-by-Step Fixes

### Fix 1: Wedding Creation Method
```typescript
async createWedding(userId: number, insertWedding: InsertWedding): Promise<Wedding> {
  try {
    console.log("Creating wedding with data:", { ...insertWedding, userId });
    
    // Ensure all required fields have defaults
    const weddingData = {
      ...insertWedding,
      userId,
      timezone: insertWedding.timezone || 'Asia/Tashkent',
      defaultLanguage: insertWedding.defaultLanguage || 'en',
      availableLanguages: insertWedding.availableLanguages || ['en'],
      template: insertWedding.template || 'garden-romance',
      primaryColor: insertWedding.primaryColor || '#D4B08C',
      accentColor: insertWedding.accentColor || '#89916B',
      isPublic: insertWedding.isPublic ?? true
    };
    
    console.log("Final wedding data to insert:", weddingData);
    
    const [wedding] = await db
      .insert(weddings)
      .values(weddingData)
      .returning();
    
    console.log("Wedding created successfully:", wedding);
    return wedding;
  } catch (error) {
    console.error("Database wedding creation error:", error);
    throw error;
  }
}
```

### Fix 2: Delete Wedding Method
```typescript
async deleteWedding(id: number): Promise<boolean> {
  try {
    // Delete related data first to avoid foreign key constraints
    await db.delete(guestBookEntries).where(eq(guestBookEntries.weddingId, id));
    await db.delete(photos).where(eq(photos.weddingId, id));
    await db.delete(guests).where(eq(guests.weddingId, id));
    await db.delete(invitations).where(eq(invitations.weddingId, id));
    await db.delete(guestCollaborators).where(eq(guestCollaborators.weddingId, id));
    // Delete wedding access records
    await db.delete(weddingAccess).where(eq(weddingAccess.weddingId, id));
    
    // Now delete the wedding itself
    const result = await db.delete(weddings).where(eq(weddings.id, id));
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Delete wedding error:', error);
    return false;
  }
}
```

### Fix 3: Delete Photo Method
```typescript
async deletePhoto(id: number): Promise<boolean> {
  const result = await db.delete(photos).where(eq(photos.id, id));
  return (result.rowCount ?? 0) > 0;
}
```

### Fix 4: Create Invitation Method
```typescript
async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
  const [newInvitation] = await db
    .insert(invitations)
    .values(invitation)
    .returning();
  return newInvitation;
}
```

### Fix 5: Update Collaborator Status Method
```typescript
async updateCollaboratorStatus(id: number, status: string): Promise<GuestCollaborator | undefined> {
  const [collaborator] = await db
    .update(guestCollaborators)
    .set({ status })
    .where(eq(guestCollaborators.id, id))
    .returning();
  return collaborator || undefined;
}
```

### Fix 6: Create Wedding Access Method
```typescript
async createWeddingAccess(access: InsertWeddingAccess): Promise<WeddingAccess> {
  const [newAccess] = await db
    .insert(weddingAccess)
    .values(access)
    .returning();
  return newAccess;
}
```

### Fix 7: Update Wedding Access Method
```typescript
async updateWeddingAccess(id: number, updates: Partial<InsertWeddingAccess>): Promise<WeddingAccess | undefined> {
  const [access] = await db
    .update(weddingAccess)
    .set(updates)
    .where(eq(weddingAccess.id, id))
    .returning();
  return access || undefined;
}
```

## Additional Type Definitions Needed

### Add to shared/schema.ts
```typescript
// Add proper type definitions for access levels
export type AccessLevel = "guest_manager" | "owner" | "viewer";

// Update WeddingAccess schema if needed
export const weddingAccess = pgTable("wedding_access", {
  id: serial("id").primaryKey(),
  weddingId: integer("wedding_id").references(() => weddings.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  accessLevel: varchar("access_level", { length: 50 }).$type<AccessLevel>().notNull().default("viewer"),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

## Testing the Fixes

After applying these fixes:

1. **Run TypeScript check**: `npx tsc --noEmit`
2. **Test compilation**: `npm run build`
3. **Test database operations**: Create a test wedding to ensure all methods work

## Common Patterns to Follow

1. **Always provide defaults** for optional fields
2. **Use nullish coalescing** (`??`) for boolean defaults
3. **Check rowCount properly** with `(result.rowCount ?? 0) > 0`
4. **Use proper union types** for enums like access levels
5. **Ensure array types** are properly typed as `string[]`

## If Errors Persist

If you still have errors after applying these fixes:

1. **Check schema consistency** between database and TypeScript types
2. **Update Drizzle schema** if database structure has changed
3. **Regenerate types** using `npx drizzle-kit generate`
4. **Restart TypeScript server** in your IDE

This should resolve all 20 TypeScript errors in your storage.ts file. 