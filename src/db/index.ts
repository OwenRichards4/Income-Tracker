import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// In dev, this module gets re-evaluated on every hot reload. Without caching
// the client, each reload opened a brand new connection pool against
// Supabase's pooler without closing the previous one — over a dev session
// that exhausts the pooler's connection limit, and queries start failing
// with errors that look unrelated to anything in the query itself. Caching
// on globalThis survives HMR so dev reuses one pool instead of leaking a new
// one per edit.
const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.postgresClient ?? postgres(process.env.DATABASE_URL, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
