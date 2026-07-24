// Shift/WageEntry shapes used throughout the client — populated from
// Supabase now (see src/app/shifts/actions.ts, src/app/paychecks/actions.ts)
// rather than the one-time localStorage seed this file used to hold.

// Fixed set, matches the Postgres enum in src/db/schema.ts.
export type ShiftType = "opening" | "bd" | "closing";

// Single source of truth for both display order (Opening, BD, Closing —
// object key order) and label text, so the form and any table/chart stay in
// sync rather than each hardcoding their own copy.
export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  opening: "Opening",
  bd: "BD",
  closing: "Closing",
};

// Shown wherever an unset shiftType needs a label (table, future chart) —
// covers both shifts logged before this field existed and shifts that just
// genuinely don't fit any of the three (e.g. servers, whose hours don't line
// up with the bar shift structure those were defined around). Deliberately
// optional rather than a forced 4th choice: for a server it would always be
// the same answer, every time, which is friction without any real signal.
export const GENERAL_SHIFT_LABEL = "General";

export interface Shift {
  id: string;
  date: string;
  hoursWorked: number;
  tipsAmount: number;
  role: string | null;
  shiftType: ShiftType | null;
  notes: string | null;
  // When this row was logged in the app — drives "recent entries" ordering
  // (newest logged first), which is deliberately independent of `date` so a
  // late-logged entry for an old shift still surfaces instead of getting
  // buried under it. Not shown in the UI.
  createdAt: string;
}

export interface WageEntry {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  netPay: number;
  notes: string | null;
  // See Shift.createdAt.
  createdAt: string;
  // Once true, this entry's payroll-discrepancy warning (see
  // payroll-discrepancy.ts) stays suppressed permanently instead of
  // reappearing on every load.
  discrepancyDismissed: boolean;
}
