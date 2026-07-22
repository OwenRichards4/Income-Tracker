// Shift/WageEntry shapes used throughout the client — populated from
// Supabase now (see src/app/shifts/actions.ts, src/app/paychecks/actions.ts)
// rather than the one-time localStorage seed this file used to hold.

export interface Shift {
  id: string;
  date: string;
  hoursWorked: number;
  tipsAmount: number;
  role: string | null;
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
