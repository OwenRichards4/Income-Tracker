"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { shifts, roles } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { Shift } from "@/lib/local-data";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// The client model keeps `role` as the role's name (see local-data.ts) —
// simpler for the UI and for payroll-discrepancy.ts's rate lookups — while
// the table stores a normalized `roleId` FK. This module is the one place
// that translates between the two.
async function resolveRoleId(userId: string, roleName: string | null): Promise<string | null> {
  if (!roleName) return null;
  const [match] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.userId, userId), eq(roles.name, roleName)));
  return match?.id ?? null;
}

function toShift(row: {
  id: string;
  date: string;
  hoursWorked: string;
  tipsAmount: string;
  notes: string | null;
  createdAt: Date;
  roleName: string | null;
}): Shift {
  return {
    id: row.id,
    date: row.date,
    hoursWorked: Number(row.hoursWorked),
    tipsAmount: Number(row.tipsAmount),
    role: row.roleName,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getShifts(): Promise<Shift[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const rows = await db
    .select({
      id: shifts.id,
      date: shifts.date,
      hoursWorked: shifts.hoursWorked,
      tipsAmount: shifts.tipsAmount,
      notes: shifts.notes,
      createdAt: shifts.createdAt,
      roleName: roles.name,
    })
    .from(shifts)
    .leftJoin(roles, eq(shifts.roleId, roles.id))
    .where(eq(shifts.userId, userId));

  return rows.map(toShift);
}

export interface ShiftInput {
  date: string;
  hoursWorked: number;
  tipsAmount: number;
  role: string | null;
  notes: string | null;
}

export async function createShift(input: ShiftInput): Promise<Shift> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  const roleId = await resolveRoleId(userId, input.role);
  const [row] = await db
    .insert(shifts)
    .values({
      userId,
      roleId,
      date: input.date,
      hoursWorked: String(input.hoursWorked),
      tipsAmount: String(input.tipsAmount),
      notes: input.notes,
    })
    .returning();

  return toShift({ ...row, roleName: input.role });
}

export async function updateShift(id: string, input: ShiftInput): Promise<Shift> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  const roleId = await resolveRoleId(userId, input.role);
  const [row] = await db
    .update(shifts)
    .set({
      date: input.date,
      hoursWorked: String(input.hoursWorked),
      tipsAmount: String(input.tipsAmount),
      notes: input.notes,
      roleId,
    })
    .where(and(eq(shifts.id, id), eq(shifts.userId, userId)))
    .returning();

  if (!row) throw new Error("Shift not found");
  return toShift({ ...row, roleName: input.role });
}

export async function deleteShift(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  await db.delete(shifts).where(and(eq(shifts.id, id), eq(shifts.userId, userId)));
}
