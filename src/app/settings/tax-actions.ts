"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

// Mirrors the schema's own column defaults (src/db/schema.ts) — used when a
// user has no settings row yet, so a first-time visitor sees the same
// numbers the app always used before this was configurable.
const DEFAULT_ESTIMATED_INCOME_TAX_RATE = 0.12;
const DEFAULT_FICA_RATE = 0.0765;

export interface TaxSettings {
  estimatedIncomeTaxRate: number;
  ficaRate: number;
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getTaxSettings(): Promise<TaxSettings> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      estimatedIncomeTaxRate: DEFAULT_ESTIMATED_INCOME_TAX_RATE,
      ficaRate: DEFAULT_FICA_RATE,
    };
  }

  const [row] = await db.select().from(settings).where(eq(settings.userId, userId));
  return {
    estimatedIncomeTaxRate: row
      ? Number(row.estimatedIncomeTaxRate)
      : DEFAULT_ESTIMATED_INCOME_TAX_RATE,
    ficaRate: row ? Number(row.ficaRate) : DEFAULT_FICA_RATE,
  };
}

// FICA isn't included here — it's a fixed statutory rate, not a personal
// choice, so the UI never offers to edit it (see the settings page).
export async function updateIncomeTaxRate(rate: number): Promise<TaxSettings> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  const [row] = await db
    .insert(settings)
    .values({ userId, estimatedIncomeTaxRate: String(rate) })
    .onConflictDoUpdate({
      target: settings.userId,
      set: { estimatedIncomeTaxRate: String(rate) },
    })
    .returning();

  return {
    estimatedIncomeTaxRate: Number(row.estimatedIncomeTaxRate),
    ficaRate: Number(row.ficaRate),
  };
}
