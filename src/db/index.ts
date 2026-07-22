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
  globalForDb.postgresClient ??
  postgres(process.env.DATABASE_URL, {
    prepare: false,
    // Supabase's pooler can silently recycle an idle backend connection;
    // postgres.js otherwise holds connections open indefinitely and won't
    // notice until a query tries to use one the pooler already dropped.
    // Closing our side proactively means a fresh connection gets opened on
    // the next query instead of reusing a dead one.
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });

// A read can still land on a connection the pooler recycled between our
// idle_timeout checks — a single transient failure, not a real bug. One
// retry opens a fresh connection and resolves it; a second failure in a row
// is a genuine error and should still surface.
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn("Query failed once, retrying with a fresh connection:", error);
    return await fn();
  }
}
