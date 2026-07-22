"use server";

import { and, eq } from "drizzle-orm";
import { db, withDbRetry } from "@/db";
import { wageEntries } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { WageEntry } from "@/lib/local-data";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function toWageEntry(row: {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossPay: string;
  netPay: string;
  notes: string | null;
  createdAt: Date;
  discrepancyDismissed: boolean;
}): WageEntry {
  return {
    id: row.id,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    grossPay: Number(row.grossPay),
    netPay: Number(row.netPay),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    discrepancyDismissed: row.discrepancyDismissed,
  };
}

export async function getWageEntries(): Promise<WageEntry[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const rows = await withDbRetry(() =>
    db.select().from(wageEntries).where(eq(wageEntries.userId, userId)),
  );
  return rows.map(toWageEntry);
}

export interface WageEntryInput {
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  netPay: number;
  notes: string | null;
}

export async function createWageEntry(input: WageEntryInput): Promise<WageEntry> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  const [row] = await db
    .insert(wageEntries)
    .values({
      userId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      grossPay: String(input.grossPay),
      netPay: String(input.netPay),
      notes: input.notes,
    })
    .returning();

  return toWageEntry(row);
}

export async function updateWageEntry(id: string, input: WageEntryInput): Promise<WageEntry> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  const [row] = await db
    .update(wageEntries)
    .set({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      grossPay: String(input.grossPay),
      netPay: String(input.netPay),
      notes: input.notes,
    })
    .where(and(eq(wageEntries.id, id), eq(wageEntries.userId, userId)))
    .returning();

  if (!row) throw new Error("Paycheck not found");
  return toWageEntry(row);
}

export async function dismissDiscrepancy(id: string): Promise<WageEntry> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  const [row] = await db
    .update(wageEntries)
    .set({ discrepancyDismissed: true })
    .where(and(eq(wageEntries.id, id), eq(wageEntries.userId, userId)))
    .returning();

  if (!row) throw new Error("Paycheck not found");
  return toWageEntry(row);
}

export async function deleteWageEntry(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  await db.delete(wageEntries).where(and(eq(wageEntries.id, id), eq(wageEntries.userId, userId)));
}
