"use client";

import type { Shift } from "@/lib/local-data";
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
          header: "Role",
          render: (s) => <span className="text-muted-foreground">{s.role ?? "—"}</span>,
        },
      ]}
    />
  );
}
