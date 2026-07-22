"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface Column<T> {
  header: string;
  align?: "right";
  render: (item: T) => React.ReactNode;
}

interface EntriesTableProps<T> {
  items: T[];
  // Entry order (newest logged first) — deliberately independent of the
  // shift/pay-period date so a late-logged entry for an old date still
  // surfaces here instead of sorting to the bottom under its date.
  getSortKey: (item: T) => string;
  getKey: (item: T) => string;
  getHref: (item: T) => string;
  getAriaLabel: (item: T) => string;
  columns: Column<T>[];
  emptyMessage: string;
}

const DEFAULT_VISIBLE = 5;

// Shared shell for the dashboard's "recent X" tables — sorting, the
// show-all/show-less toggle, row navigation, and the empty state. Each
// caller only supplies its own columns and accessors.
export function EntriesTable<T>({
  items,
  getSortKey,
  getKey,
  getHref,
  getAriaLabel,
  columns,
  emptyMessage,
}: EntriesTableProps<T>) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const sorted = [...items].sort((a, b) => {
    const ka = getSortKey(a);
    const kb = getSortKey(b);
    return ka < kb ? 1 : ka > kb ? -1 : 0;
  });
  const visibleRows = expanded ? sorted : sorted.slice(0, DEFAULT_VISIBLE);

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`py-2 pr-3 font-medium ${column.align === "right" ? "text-right" : ""}`}
                >
                  {column.header}
                </th>
              ))}
              <th className="w-6 py-2" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((item) => {
              const href = getHref(item);
              return (
                <tr
                  key={getKey(item)}
                  role="link"
                  tabIndex={0}
                  aria-label={getAriaLabel(item)}
                  onClick={() => router.push(href)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") router.push(href);
                  }}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
                >
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={`py-2.5 pr-3 ${column.align === "right" ? "text-right font-medium text-foreground" : "text-foreground"}`}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                  <td className="py-2.5 pl-1">
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length > DEFAULT_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 cursor-pointer text-sm font-medium text-accent hover:opacity-80"
        >
          {expanded ? "Show less" : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}
