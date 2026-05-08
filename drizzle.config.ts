import { defineConfig } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: DATABASE_URL && DATABASE_URL.startsWith('postgres') ? "postgresql" : "sqlite",
  dbCredentials: DATABASE_URL && DATABASE_URL.startsWith('postgres') 
    ? { url: DATABASE_URL }
    : { url: "wedding.db" },
});
