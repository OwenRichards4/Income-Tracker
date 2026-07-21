"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface RoleDTO {
  id: string;
  name: string;
  baseHourlyRate: number;
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function toRole(row: { id: string; name: string; baseHourlyRate: string }): RoleDTO {
  return { id: row.id, name: row.name, baseHourlyRate: Number(row.baseHourlyRate) };
}

export async function getRoles(): Promise<RoleDTO[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const rows = await db.select().from(roles).where(eq(roles.userId, userId));
  return rows.map(toRole);
}

export async function createRole(name: string, baseHourlyRate: number): Promise<RoleDTO> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");

  const [row] = await db
    .insert(roles)
    .values({ userId, name, baseHourlyRate: String(baseHourlyRate) })
    .returning();

  return toRole(row);
}

export async function deleteRole(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  await db.delete(roles).where(and(eq(roles.id, id), eq(roles.userId, userId)));
}
