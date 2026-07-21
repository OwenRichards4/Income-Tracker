"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Shift, WageEntry } from "@/lib/local-data";

interface RecentEntriesTableProps {
  shifts: Shift[];
  wageEntries: WageEntry[];
}

interface Row {
  id: string;
  // Entry order (newest logged first) — deliberately independent of the
  // shift/pay-period date so a late-logged entry for an old date still
  // surfaces here instead of sorting to the bottom under its date.
  sortKey: string;
  displayDate: string;
  type: "Tips" | "Paycheck";
  role: string | null;
  hours: number | null;
  amount: number;
  href: string;
}

const DEFAULT_VISIBLE = 5;

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function RecentEntriesTable({ shifts, wageEntries }: RecentEntriesTableProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const rows: Row[] = [
    ...shifts.map((s) => ({
      id: s.id,
      sortKey: s.createdAt,
      displayDate: formatDisplayDate(s.date),
      type: "Tips" as const,
      role: s.role,
      hours: s.hoursWorked,
      amount: s.tipsAmount,
      href: `/shifts/${s.id}/edit`,
    })),
    ...wageEntries.map((w) => ({
      id: w.id,
      sortKey: w.createdAt,
      displayDate: `${formatDisplayDate(w.periodStart)} – ${formatDisplayDate(w.periodEnd)}`,
      type: "Paycheck" as const,
      role: null,
      hours: null,
      amount: w.grossPay,
      href: `/paychecks/${w.id}/edit`,
    })),
  ].sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));

  const visibleRows = expanded ? rows : rows.slice(0, DEFAULT_VISIBLE);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No entries logged in this period yet.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 text-right font-medium">Amount</th>
              <th className="py-2 pr-3 font-medium">Hours</th>
              <th className="py-2 pr-3 font-medium">Role</th>
              <th className="w-6 py-2" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                role="link"
                tabIndex={0}
                aria-label={`Edit ${row.type.toLowerCase()} entry from ${row.displayDate}`}
                onClick={() => router.push(row.href)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") router.push(row.href);
                }}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
              >
                <td className="py-2.5 pr-3 text-foreground">{row.displayDate}</td>
                <td className="py-2.5 pr-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {row.type}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right font-medium text-foreground">
                  ${row.amount.toFixed(2)}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {row.hours !== null ? `${row.hours} hr` : "—"}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">{row.role ?? "—"}</td>
                <td className="py-2.5 pl-1">
                  <ChevronRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > DEFAULT_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 cursor-pointer text-sm font-medium text-accent hover:opacity-80"
        >
          {expanded ? "Show less" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}
