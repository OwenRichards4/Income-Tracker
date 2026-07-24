"use client";

import { GENERAL_SHIFT_LABEL, SHIFT_TYPE_LABELS, type Shift } from "@/lib/local-data";
import { parseLocalDateString } from "@/lib/shift-entry";
import { EntriesTable } from "./entries-table";

interface RecentShiftsTableProps {
  shifts: Shift[];
}

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatWeekday(iso: string): string {
  const date = parseLocalDateString(iso);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export function RecentShiftsTable({ shifts }: RecentShiftsTableProps) {
  return (
    <EntriesTable
      items={shifts}
      getKey={(s) => s.id}
      getSortKey={(s) => s.createdAt}
      getHref={(s) => `/shifts/${s.id}/edit`}
      getAriaLabel={(s) => `Edit tips entry from ${formatDisplayDate(s.date)}`}
      emptyMessage="No tips logged in this period yet."
      columns={[
        { header: "Date", render: (s) => formatDisplayDate(s.date) },
        {
          header: "Amount",
          align: "right",
          render: (s) => `$${s.tipsAmount.toFixed(2)}`,
        },
        {
          header: "Hours",
          render: (s) => (
            <span className="text-muted-foreground">{s.hoursWorked} hr</span>
          ),
        },
        {
          header: "Shift type",
          render: (s) => (
            <span className="text-muted-foreground">
              {s.shiftType ? SHIFT_TYPE_LABELS[s.shiftType] : GENERAL_SHIFT_LABEL}
            </span>
          ),
        },
        {
          header: "Day",
          render: (s) => <span className="text-muted-foreground">{formatWeekday(s.date)}</span>,
        },
        {
          header: "Role",
          render: (s) => <span className="text-muted-foreground">{s.role ?? "—"}</span>,
        },
      ]}
    />
  );
}
