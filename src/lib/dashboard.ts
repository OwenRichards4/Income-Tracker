import { parseLocalDateString, formatDateInputValue } from "./shift-entry";
import {
  GENERAL_SHIFT_LABEL,
  SHIFT_TYPE_LABELS,
  type Shift,
  type ShiftType,
  type WageEntry,
} from "./local-data";

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

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
      return {
        start: formatDateInputValue(startOfMonth(ref)),
        end: formatDateInputValue(endOfMonth(ref)),
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
      const prevRef = subtractOneMonth(ref);
      return getPeriodRange("month", formatDateInputValue(prevRef), weekStartDay);
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

// A shift's own shiftType, or "general" for shifts that don't have one set
// (see local-data.ts's GENERAL_SHIFT_LABEL). Fixed order — General last,
// since it isn't a real shift-type peer, just "unclassified" — matches the
// --series-* CSS custom properties in globals.css and is the single source
// both the chart and its legend build from.
export type ShiftSeriesKey = ShiftType | "general";

export const SHIFT_TYPE_SERIES: { key: ShiftSeriesKey; label: string }[] = [
  ...(Object.entries(SHIFT_TYPE_LABELS) as [ShiftType, string][]).map(([key, label]) => ({
    key: key as ShiftSeriesKey,
    label,
  })),
  { key: "general", label: GENERAL_SHIFT_LABEL },
];

export interface ShiftTypeAverage {
  key: ShiftSeriesKey;
  label: string;
  average: number;
  count: number;
}

export interface WeekdayGroup {
  label: string;
  // Fixed order/length — always one entry per SHIFT_TYPE_SERIES slot, even
  // when a day has zero shifts of that type, so groups stay aligned across
  // every weekday and the legend's color-to-position mapping never shifts.
  series: ShiftTypeAverage[];
  totalCount: number;
}

export function averageTipsByWeekdayAndShiftType(
  shifts: Shift[],
  weekStartDay = 1, // Monday, matching the actual work week
): WeekdayGroup[] {
  const buckets = WEEKDAY_LABELS.map(() => new Map<string, { total: number; count: number }>());
  for (const shift of shifts) {
    const date = parseLocalDateString(shift.date);
    if (!date) continue;
    const key = shift.shiftType ?? "general";
    const dayBuckets = buckets[date.getDay()];
    const bucket = dayBuckets.get(key) ?? { total: 0, count: 0 };
    bucket.total += shift.tipsAmount;
    bucket.count += 1;
    dayBuckets.set(key, bucket);
  }

  // Rotate so the week reads in the order it's actually worked, not always
  // calendar-standard Sunday-first.
  const orderedBuckets = [...buckets.slice(weekStartDay), ...buckets.slice(0, weekStartDay)];
  const orderedLabels = [
    ...WEEKDAY_LABELS.slice(weekStartDay),
    ...WEEKDAY_LABELS.slice(0, weekStartDay),
  ];

  return orderedBuckets.map((dayBuckets, i) => {
    const series = SHIFT_TYPE_SERIES.map(({ key, label }) => {
      const bucket = dayBuckets.get(key) ?? { total: 0, count: 0 };
      return {
        key,
        label,
        average: bucket.count > 0 ? Math.round((bucket.total / bucket.count) * 100) / 100 : 0,
        count: bucket.count,
      };
    });
    return {
      label: orderedLabels[i],
      series,
      totalCount: series.reduce((sum, s) => sum + s.count, 0),
    };
  });
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

export interface TrendPoint {
  // Sort key — a day/week-start/month-start ISO date, whichever the bucket
  // granularity below is. Not shown in the UI.
  key: string;
  label: string;
  rate: number;
}

function formatDayLabel(iso: string): string {
  const date = parseLocalDateString(iso);
  return date ? date.toLocaleDateString(undefined, { weekday: "short" }) : "";
}

function formatWeekLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatMonthLabel(iso: string): string {
  const date = parseLocalDateString(iso);
  return date ? date.toLocaleDateString(undefined, { month: "short" }) : "";
}

// Bucket granularity adapts to the viewed period so there's always a
// meaningful multi-point trend instead of either a single dot (a whole week
// of shifts all landing in one weekly bucket) or a dense, noisy cloud (a
// full year plotted day-by-day): day-by-day within a week, week-by-week
// within a month (unchanged from the original design), month-by-month for a
// year or the all-time view.
export function tipsPerHourTrend(
  shifts: Shift[],
  period: Period,
  weekStartDay = 1,
): TrendPoint[] {
  const granularity = period === "week" ? "day" : period === "month" ? "week" : "month";
  const formatLabel =
    granularity === "day" ? formatDayLabel : granularity === "week" ? formatWeekLabel : formatMonthLabel;

  const buckets = new Map<string, { tips: number; hours: number }>();
  for (const shift of shifts) {
    if (shift.hoursWorked <= 0) continue;
    const date = parseLocalDateString(shift.date);
    if (!date) continue;
    const key =
      granularity === "day"
        ? shift.date
        : granularity === "week"
          ? formatDateInputValue(startOfWeek(date, weekStartDay))
          : formatDateInputValue(startOfMonth(date));
    const bucket = buckets.get(key) ?? { tips: 0, hours: 0 };
    bucket.tips += shift.tipsAmount;
    bucket.hours += shift.hoursWorked;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .map(([key, { tips, hours }]) => ({
      key,
      label: formatLabel(key),
      rate: hours > 0 ? Math.round((tips / hours) * 100) / 100 : 0,
    }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}
