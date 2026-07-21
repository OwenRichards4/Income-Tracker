import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js reads .env.local automatically; drizzle-kit runs standalone via
// the CLI and otherwise defaults to .env, which this project doesn't use.
config({ path: ".env.local" });

// dbCredentials is only read by commands that connect (migrate/push/studio/pull);
// `generate` just diffs the schema file, so DATABASE_URL isn't required for it.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Supabase owns the `auth` schema; only manage our own tables.
  schemaFilter: ["public"],
});
