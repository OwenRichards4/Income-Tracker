import { parseLocalDateString, formatDateInputValue } from "./shift-entry";
import type { Shift, WageEntry } from "./local-data";

export type Period = "week" | "month" | "year" | "all";

export interface DateRange {
  start: string | null; // null = unbounded
  end: string | null;
}

export function startOfWeek(date: Date, weekStartDay: number): Date {
  const result = new Date(date);
  const diff = (result.getDay() - weekStartDay + 7) % 7;
  result.setDate(result.getDate() - diff);
  return result;
}

function endOfWeek(date: Date, weekStartDay: number): Date {
  const start = startOfWeek(date, weekStartDay);
  start.setDate(start.getDate() + 6);
  return start;
}

// `date` shifted by `delta` months, clamped to the target month's last day
// rather than overflowing (e.g. Jan 31 + 1mo -> Feb 28/29, not Mar 3).
function shiftMonths(date: Date, delta: number): Date {
  const firstOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + delta, 1);
  const daysInTargetMonth = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0,
  ).getDate();
  firstOfTargetMonth.setDate(Math.min(date.getDate(), daysInTargetMonth));
  return firstOfTargetMonth;
}

function subtractOneMonth(date: Date): Date {
  return shiftMonths(date, -1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}

export function getPeriodRange(
  period: Period,
  referenceDateISO: string,
  weekStartDay = 1, // Monday, matching the actual work week
): DateRange {
  const ref = parseLocalDateString(referenceDateISO);
  if (!ref) return { start: null, end: null };

  switch (period) {
    case "week":
      return {
        start: formatDateInputValue(startOfWeek(ref, weekStartDay)),
        end: formatDateInputValue(endOfWeek(ref, weekStartDay)),
      };
    case "month":
      // Rolling 1-month window ending today, not the calendar month — so
      // it doesn't reset to near-empty on the 1st.
      return {
        start: formatDateInputValue(subtractOneMonth(ref)),
        end: formatDateInputValue(ref),
      };
    case "year":
      return {
        start: formatDateInputValue(startOfYear(ref)),
        end: formatDateInputValue(endOfYear(ref)),
      };
    case "all":
      return { start: null, end: null };
  }
}

// The period immediately before the current one, same length — used for
// the "vs last period" delta on the headline metric card.
export function getPreviousPeriodRange(
  period: Period,
  referenceDateISO: string,
  weekStartDay = 1,
): DateRange | null {
  const ref = parseLocalDateString(referenceDateISO);
  if (!ref) return null;

  switch (period) {
    case "week": {
      const prevRef = new Date(ref);
      prevRef.setDate(prevRef.getDate() - 7);
      return getPeriodRange("week", formatDateInputValue(prevRef), weekStartDay);
    }
    case "month": {
      // The prior rolling month, immediately before the current window:
      // two months back through one month back.
      const prevEnd = subtractOneMonth(ref);
      return {
        start: formatDateInputValue(subtractOneMonth(prevEnd)),
        end: formatDateInputValue(prevEnd),
      };
    }
    case "year": {
      const prevRef = new Date(ref.getFullYear() - 1, 0, 1);
      return getPeriodRange("year", formatDateInputValue(prevRef), weekStartDay);
    }
    case "all":
      return null;
  }
}

// Moves the reference date one period step forward (+1) or back (-1) — the
// date fed back into getPeriodRange to browse to the adjacent week/month/year.
export function advancePeriod(
  period: Period,
  referenceDateISO: string,
  direction: 1 | -1,
): string {
  const ref = parseLocalDateString(referenceDateISO);
  if (!ref) return referenceDateISO;

  switch (period) {
    case "week": {
      const next = new Date(ref);
      next.setDate(next.getDate() + direction * 7);
      return formatDateInputValue(next);
    }
    case "month":
      return formatDateInputValue(shiftMonths(ref, direction));
    case "year":
      return formatDateInputValue(
        new Date(ref.getFullYear() + direction, ref.getMonth(), ref.getDate()),
      );
    case "all":
      return referenceDateISO;
  }
}

function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Human-readable label for the currently viewed range, e.g. "Jul 20 – Jul
// 26, 2026" for a week, or just "2026" for a year.
export function formatRangeLabel(period: Period, range: DateRange): string {
  if (period === "year") {
    return range.start?.slice(0, 4) ?? "";
  }
  if (!range.start || !range.end) return "";

  const startYear = range.start.slice(0, 4);
  const endYear = range.end.slice(0, 4);
  const startLabel = formatShortDate(range.start);
  const endLabel = formatShortDate(range.end);

  return startYear === endYear
    ? `${startLabel} – ${endLabel}, ${endYear}`
    : `${startLabel}, ${startYear} – ${endLabel}, ${endYear}`;
}

export function isWithinRange(dateISO: string, range: DateRange): boolean {
  if (range.start && dateISO < range.start) return false;
  if (range.end && dateISO > range.end) return false;
  return true;
}

export function filterShiftsByRange(
  shifts: Shift[],
  range: DateRange,
): Shift[] {
  return shifts.filter((s) => isWithinRange(s.date, range));
}

export function filterWageEntriesByRange(
  entries: WageEntry[],
  range: DateRange,
): WageEntry[] {
  // A pay period counts if it overlaps the range at all.
  return entries.filter(
    (e) =>
      (!range.start || e.periodEnd >= range.start) &&
      (!range.end || e.periodStart <= range.end),
  );
}

export function sumTips(shifts: Shift[]): number {
  return shifts.reduce((total, s) => total + s.tipsAmount, 0);
}

export function sumHours(shifts: Shift[]): number {
  return shifts.reduce((total, s) => total + s.hoursWorked, 0);
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface WeekdayAverage {
  label: string;
  average: number;
  count: number;
}

export function averageTipsByWeekday(
  shifts: Shift[],
  weekStartDay = 1, // Monday, matching the actual work week
): WeekdayAverage[] {
  const buckets = WEEKDAY_LABELS.map((label) => ({ label, total: 0, count: 0 }));
  for (const shift of shifts) {
    const date = parseLocalDateString(shift.date);
    if (!date) continue;
    const bucket = buckets[date.getDay()];
    bucket.total += shift.tipsAmount;
    bucket.count += 1;
  }
  // Rotate so the week reads in the order it's actually worked, not always
  // calendar-standard Sunday-first.
  const ordered = [...buckets.slice(weekStartDay), ...buckets.slice(0, weekStartDay)];
  return ordered.map((b) => ({
    label: b.label,
    average: b.count > 0 ? Math.round((b.total / b.count) * 100) / 100 : 0,
    count: b.count,
  }));
}

export interface RoleTotal {
  role: string;
  total: number;
  count: number;
}

export function sumTipsByRole(shifts: Shift[]): RoleTotal[] {
  const buckets = new Map<string, { total: number; count: number }>();
  for (const shift of shifts) {
    if (!shift.role) continue;
    const bucket = buckets.get(shift.role) ?? { total: 0, count: 0 };
    bucket.total += shift.tipsAmount;
    bucket.count += 1;
    buckets.set(shift.role, bucket);
  }
  return [...buckets.entries()]
    .map(([role, { total, count }]) => ({
      role,
      total: Math.round(total * 100) / 100,
      count,
    }))
    .sort((a, b) => b.total - a.total);
}

export interface WeeklyTrendPoint {
  weekStart: string;
  rate: number;
}

// One point per week (rather than per shift) so the trend line stays
// readable instead of a dense, noisy cloud of daily points.
export function weeklyTipsPerHourTrend(
  shifts: Shift[],
  weekStartDay = 1,
): WeeklyTrendPoint[] {
  const buckets = new Map<string, { tips: number; hours: number }>();
  for (const shift of shifts) {
    if (shift.hoursWorked <= 0) continue;
    const date = parseLocalDateString(shift.date);
    if (!date) continue;
    const key = formatDateInputValue(startOfWeek(date, weekStartDay));
    const bucket = buckets.get(key) ?? { tips: 0, hours: 0 };
    bucket.tips += shift.tipsAmount;
    bucket.hours += shift.hoursWorked;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .map(([weekStart, { tips, hours }]) => ({
      weekStart,
      rate: hours > 0 ? Math.round((tips / hours) * 100) / 100 : 0,
    }))
    .sort((a, b) => (a.weekStart < b.weekStart ? -1 : a.weekStart > b.weekStart ? 1 : 0));
}
