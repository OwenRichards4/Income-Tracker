import type { Shift, WageEntry } from "./local-data";

// How far actual gross pay can drift from what the logged hours would
// predict before it's worth flagging — loose enough to absorb normal
// payroll rounding/rate quirks, tight enough to catch a missed clock-in or
// a paycheck that's genuinely wrong.
const DEFAULT_THRESHOLD_PCT = 15;

export interface PayrollDiscrepancy {
  wageEntryId: string;
  periodStart: string;
  periodEnd: string;
  expectedGross: number;
  actualGross: number;
  percentDiff: number;
}

interface RoleRate {
  name: string;
  baseHourlyRate: number;
}

// Compares each paycheck's actual gross pay against what the shifts logged
// in that same pay period would predict (hours × the shift's role's base
// rate). Flags anything off by more than `thresholdPct` — a likely sign of
// a missed clock-in/out or a payroll error, not proof of one.
export function detectPayrollDiscrepancies(
  wageEntries: WageEntry[],
  shifts: Shift[],
  roles: RoleRate[],
  thresholdPct = DEFAULT_THRESHOLD_PCT,
): PayrollDiscrepancy[] {
  const rateByRole = new Map(roles.map((r) => [r.name, r.baseHourlyRate]));
  const results: PayrollDiscrepancy[] = [];

  for (const entry of wageEntries) {
    const periodShifts = shifts.filter(
      (s) => s.date >= entry.periodStart && s.date <= entry.periodEnd,
    );

    let expectedGross = 0;
    let matchedAny = false;
    for (const shift of periodShifts) {
      if (!shift.role) continue;
      const rate = rateByRole.get(shift.role);
      if (rate === undefined) continue;
      expectedGross += shift.hoursWorked * rate;
      matchedAny = true;
    }

    // Nothing to compare against — no rated shifts in this period at all.
    if (!matchedAny || expectedGross <= 0) continue;

    const percentDiff = (Math.abs(entry.grossPay - expectedGross) / expectedGross) * 100;
    if (percentDiff > thresholdPct) {
      results.push({
        wageEntryId: entry.id,
        periodStart: entry.periodStart,
        periodEnd: entry.periodEnd,
        expectedGross: Math.round(expectedGross * 100) / 100,
        actualGross: entry.grossPay,
        percentDiff: Math.round(percentDiff * 10) / 10,
      });
    }
  }

  return results.sort((a, b) => (a.periodEnd < b.periodEnd ? 1 : -1));
}
