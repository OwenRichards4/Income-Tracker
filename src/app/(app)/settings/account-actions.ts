"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { roles, shifts, wageEntries, settings } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Wipes every tip, paycheck, role, and settings row for the signed-in
// account — everything except the ability to sign back in. Transactional so
// a failure partway through can't leave data half-deleted.
export async function deleteAllData(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  await db.transaction(async (tx) => {
    await tx.delete(shifts).where(eq(shifts.userId, userId));
    await tx.delete(wageEntries).where(eq(wageEntries.userId, userId));
    await tx.delete(roles).where(eq(roles.userId, userId));
    await tx.delete(settings).where(eq(settings.userId, userId));
  });
}
