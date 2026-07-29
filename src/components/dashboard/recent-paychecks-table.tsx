"use client";

import type { WageEntry } from "@/lib/local-data";
import { useIsDemoMode } from "@/lib/demo/context";
import { EntriesTable } from "./entries-table";

interface RecentPaychecksTableProps {
  wageEntries: WageEntry[];
}

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function RecentPaychecksTable({ wageEntries }: RecentPaychecksTableProps) {
  const isDemo = useIsDemoMode();
  return (
    <EntriesTable
      items={wageEntries}
      getKey={(w) => w.id}
      getSortKey={(w) => w.createdAt}
      getHref={(w) => `${isDemo ? "/demo" : ""}/paychecks/${w.id}/edit`}
      getAriaLabel={(w) =>
        `Edit paycheck entry from ${formatDisplayDate(w.periodStart)} to ${formatDisplayDate(w.periodEnd)}`
      }
      emptyMessage="No paychecks logged in this period yet."
      columns={[
        {
          header: "Pay period",
          render: (w) => `${formatDisplayDate(w.periodStart)} – ${formatDisplayDate(w.periodEnd)}`,
        },
        {
          header: "Total earned",
          align: "right",
          render: (w) => `$${w.netPay.toFixed(2)}`,
        },
        {
          header: "Total taxed",
          align: "right",
          render: (w) => `$${(w.grossPay - w.netPay).toFixed(2)}`,
        },
        {
          header: "Gross pay",
          align: "right",
          render: (w) => `$${w.grossPay.toFixed(2)}`,
        },
      ]}
    />
  );
}
