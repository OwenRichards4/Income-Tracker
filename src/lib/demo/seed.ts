import { formatDateInputValue } from "@/lib/shift-entry";
import type { Shift, ShiftType, WageEntry } from "@/lib/local-data";
import type { Role } from "@/lib/use-roles";
import type { TaxSettings } from "@/app/(app)/settings/tax-actions";

// Fixed ids so a fresh seed is deterministic within a session — real ids
// only matter for React keys and edit-by-id lookups, never persisted
// anywhere, so there's no collision risk in reusing the same ones.
export const DEMO_ROLES: Role[] = [
  { id: "demo-role-bartender", name: "Bartender", baseHourlyRate: 8.5 },
  { id: "demo-role-server", name: "Server", baseHourlyRate: 4.75 },
  { id: "demo-role-barback", name: "Barback", baseHourlyRate: 12 },
];

export const DEMO_TAX_SETTINGS: TaxSettings = {
  estimatedIncomeTaxRate: 0.12,
  ficaRate: 0.0765,
};

function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return formatDateInputValue(date);
}

interface ShiftSeed {
  daysAgo: number;
  hoursWorked: number;
  tipsAmount: number;
  role: string;
  shiftType: ShiftType | null;
  notes: string | null;
}

// ~7 weeks of varied shifts across all three roles/shift-types, biased
// toward realistic tip ranges for each — enough spread for the weekday and
// trend charts to look like an actual bartender's data, not a flat line.
const SHIFT_SEEDS: ShiftSeed[] = [
  { daysAgo: 48, hoursWorked: 6, tipsAmount: 142, role: "Bartender", shiftType: "opening", notes: null },
  { daysAgo: 46, hoursWorked: 5.5, tipsAmount: 98, role: "Server", shiftType: null, notes: null },
  { daysAgo: 45, hoursWorked: 7, tipsAmount: 215, role: "Bartender", shiftType: "bd", notes: "Trivia night, packed" },
  { daysAgo: 43, hoursWorked: 6.5, tipsAmount: 178, role: "Bartender", shiftType: "closing", notes: null },
  { daysAgo: 41, hoursWorked: 4, tipsAmount: 61, role: "Barback", shiftType: "opening", notes: null },
  { daysAgo: 39, hoursWorked: 6, tipsAmount: 134, role: "Bartender", shiftType: "opening", notes: null },
  { daysAgo: 38, hoursWorked: 5, tipsAmount: 89, role: "Server", shiftType: null, notes: null },
  { daysAgo: 36, hoursWorked: 7.5, tipsAmount: 248, role: "Bartender", shiftType: "bd", notes: null },
  { daysAgo: 34, hoursWorked: 6.5, tipsAmount: 191, role: "Bartender", shiftType: "closing", notes: "Big group buyout" },
  { daysAgo: 32, hoursWorked: 4.5, tipsAmount: 72, role: "Barback", shiftType: "closing", notes: null },
  { daysAgo: 31, hoursWorked: 5.5, tipsAmount: 96, role: "Server", shiftType: null, notes: "Slow Tuesday" },
  { daysAgo: 29, hoursWorked: 6, tipsAmount: 151, role: "Bartender", shiftType: "opening", notes: null },
  { daysAgo: 27, hoursWorked: 7, tipsAmount: 226, role: "Bartender", shiftType: "bd", notes: null },
  { daysAgo: 25, hoursWorked: 6.5, tipsAmount: 183, role: "Bartender", shiftType: "closing", notes: null },
  { daysAgo: 24, hoursWorked: 5, tipsAmount: 84, role: "Server", shiftType: null, notes: null },
  { daysAgo: 22, hoursWorked: 4, tipsAmount: 58, role: "Barback", shiftType: "opening", notes: null },
  { daysAgo: 20, hoursWorked: 6, tipsAmount: 139, role: "Bartender", shiftType: "opening", notes: null },
  { daysAgo: 18, hoursWorked: 7.5, tipsAmount: 261, role: "Bartender", shiftType: "bd", notes: "Holiday weekend" },
  { daysAgo: 17, hoursWorked: 5.5, tipsAmount: 101, role: "Server", shiftType: null, notes: null },
  { daysAgo: 15, hoursWorked: 6.5, tipsAmount: 197, role: "Bartender", shiftType: "closing", notes: null },
  { daysAgo: 13, hoursWorked: 4.5, tipsAmount: 69, role: "Barback", shiftType: "closing", notes: null },
  { daysAgo: 11, hoursWorked: 6, tipsAmount: 146, role: "Bartender", shiftType: "opening", notes: null },
  { daysAgo: 10, hoursWorked: 5, tipsAmount: 92, role: "Server", shiftType: null, notes: null },
  { daysAgo: 8, hoursWorked: 7, tipsAmount: 232, role: "Bartender", shiftType: "bd", notes: null },
  { daysAgo: 6, hoursWorked: 6.5, tipsAmount: 188, role: "Bartender", shiftType: "closing", notes: null },
  { daysAgo: 4, hoursWorked: 4, tipsAmount: 64, role: "Barback", shiftType: "opening", notes: null },
  { daysAgo: 3, hoursWorked: 5.5, tipsAmount: 105, role: "Server", shiftType: null, notes: null },
  { daysAgo: 1, hoursWorked: 6, tipsAmount: 157, role: "Bartender", shiftType: "opening", notes: null },
];

export function buildDemoShifts(): Shift[] {
  return SHIFT_SEEDS.map((seed, i) => ({
    id: `demo-shift-${i}`,
    date: daysAgo(seed.daysAgo),
    hoursWorked: seed.hoursWorked,
    tipsAmount: seed.tipsAmount,
    role: seed.role,
    shiftType: seed.shiftType,
    notes: seed.notes,
    createdAt: new Date(Date.now() - seed.daysAgo * 86_400_000).toISOString(),
  }));
}

// Three biweekly-ish paychecks. The most recent one is deliberately off
// from what its shifts/rates would predict, so the demo shows off the
// payroll-discrepancy warning without a visitor having to do anything.
export function buildDemoWageEntries(): WageEntry[] {
  const entries: Omit<WageEntry, "id" | "createdAt">[] = [
    {
      // Expected gross from this period's shifts/rates is ~$378 — close
      // enough (~3.5% under) to stay under the 15% discrepancy threshold.
      periodStart: daysAgo(48),
      periodEnd: daysAgo(35),
      grossPay: 365,
      netPay: 293,
      notes: null,
      discrepancyDismissed: false,
    },
    {
      // ~$373 expected, ~4% under — also stays under the threshold.
      periodStart: daysAgo(34),
      periodEnd: daysAgo(21),
      grossPay: 358,
      netPay: 288,
      notes: null,
      discrepancyDismissed: false,
    },
    {
      // ~$384 expected from this period's shifts/rates — 290 is ~25% under,
      // deliberately trips the >15% discrepancy threshold so the demo shows
      // off that warning without a visitor having to do anything.
      periodStart: daysAgo(20),
      periodEnd: daysAgo(7),
      grossPay: 290,
      netPay: 233,
      notes: "Direct deposit looked short this period",
      discrepancyDismissed: false,
    },
  ];

  return entries.map((entry, i) => ({
    ...entry,
    id: `demo-wage-${i}`,
    createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
  }));
}
