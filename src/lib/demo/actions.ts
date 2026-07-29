// In-memory, per-session "backend" for /demo — same shape as the real
// Server Actions (src/app/(app)/shifts/actions.ts etc.) so the existing
// data hooks (useShifts, useWageEntries, useRoles) can swap these in
// without their callers (Dashboard, AddTipsForm, ...) knowing the
// difference. No network, no persistence: useRemoteList's own store is the
// only place these live, so a hard refresh naturally wipes them back to
// the seed data.
import type { RemoteListActions } from "@/lib/use-remote-list";
import type { Shift, WageEntry } from "@/lib/local-data";
import type { ShiftInput } from "@/app/(app)/shifts/actions";
import type { WageEntryInput } from "@/app/(app)/paychecks/actions";
import type { Role } from "@/lib/use-roles";
import type { TaxSettings } from "@/app/(app)/settings/tax-actions";
import { buildDemoShifts, buildDemoWageEntries, DEMO_ROLES, DEMO_TAX_SETTINGS } from "./seed";

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export const demoShiftActions: RemoteListActions<Shift, ShiftInput> = {
  fetchAll: async () => buildDemoShifts(),
  create: async (input) => ({
    id: newId("shift"),
    createdAt: new Date().toISOString(),
    ...input,
  }),
  update: async (id, input) => ({
    id,
    createdAt: new Date().toISOString(),
    ...input,
  }),
  remove: async () => {},
};

export const demoWageEntryActions: RemoteListActions<WageEntry, WageEntryInput> = {
  fetchAll: async () => buildDemoWageEntries(),
  create: async (input) => ({
    id: newId("wage"),
    createdAt: new Date().toISOString(),
    discrepancyDismissed: false,
    ...input,
  }),
  update: async (id, input) => ({
    id,
    createdAt: new Date().toISOString(),
    discrepancyDismissed: false,
    ...input,
  }),
  remove: async () => {},
};

interface RoleInput {
  name: string;
  baseHourlyRate: number;
}

export const demoRoleActions: RemoteListActions<Role, RoleInput> = {
  fetchAll: async () => DEMO_ROLES,
  create: async (input) => ({ id: newId("role"), ...input }),
  update: async (id, input) => ({ id, ...input }),
  remove: async () => {},
};

export async function demoGetTaxSettings(): Promise<TaxSettings> {
  return DEMO_TAX_SETTINGS;
}

export async function demoUpdateIncomeTaxRate(rate: number): Promise<TaxSettings> {
  return { ...DEMO_TAX_SETTINGS, estimatedIncomeTaxRate: rate };
}
