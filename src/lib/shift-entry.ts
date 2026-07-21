// Shifts that run past midnight (e.g. 5pm–2am) should still log against the
// day the shift *started*. Before this hour, default the date picker to
// yesterday rather than today.
const OVERNIGHT_CUTOFF_HOUR = 6;

export function getDefaultShiftDate(now: Date): Date {
  const date = new Date(now);
  if (now.getHours() < OVERNIGHT_CUTOFF_HOUR) {
    date.setDate(date.getDate() - 1);
  }
  return date;
}

export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// `new Date("YYYY-MM-DD")` parses as UTC midnight, which rolls back a day in
// negative-UTC-offset timezones. Parse the parts and build a local date instead.
export function parseLocalDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function getWeekdayLabel(value: string): string | null {
  const date = parseLocalDateString(value);
  if (!date) return null;
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

export function hoursMinutesToDecimal(hours: number, minutes: number): number {
  return Math.round((hours + minutes / 60) * 100) / 100;
}

// Inverse of hoursMinutesToDecimal — used to pre-fill the hours/minutes
// fields when editing an existing shift.
export function decimalHoursToParts(decimal: number): {
  hours: number;
  minutes: number;
} {
  const hours = Math.floor(decimal);
  let minutes = Math.round((decimal - hours) * 60);
  let wholeHours = hours;
  if (minutes === 60) {
    wholeHours += 1;
    minutes = 0;
  }
  return { hours: wholeHours, minutes };
}
