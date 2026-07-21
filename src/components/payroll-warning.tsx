"use client";

import { useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useShifts } from "@/lib/use-shifts";
import { useWageEntries } from "@/lib/use-wage-entries";
import { useRoles } from "@/lib/use-roles";
import { detectPayrollDiscrepancies } from "@/lib/payroll-discrepancy";

// Validated (scripts/validate_palette.js) against both this app's light and
// dark card surfaces — the dataviz skill's own reference warning hex is
// sub-3:1 on a light surface, so it isn't reused here.
const WARNING_COLOR = "#d97706";

function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function PayrollWarning() {
  const [open, setOpen] = useState(false);
  const { shifts, loaded: shiftsLoaded } = useShifts();
  const { wageEntries, loaded: wageEntriesLoaded } = useWageEntries();
  const { roles, loaded: rolesLoaded } = useRoles();

  if (!shiftsLoaded || !wageEntriesLoaded || !rolesLoaded) return null;

  const discrepancies = detectPayrollDiscrepancies(wageEntries, shifts, roles);
  if (discrepancies.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${discrepancies.length} possible payout ${discrepancies.length === 1 ? "issue" : "issues"}`}
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted"
        style={{ color: WARNING_COLOR }}
      >
        <TriangleAlert className="size-5" />
      </button>

      {open && (
        <>
          {/* Click-outside catcher */}
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-lg">
            <p className="px-1 text-xs font-medium text-muted-foreground">
              Possible payout {discrepancies.length === 1 ? "issue" : "issues"}
            </p>
            <ul className="mt-2 space-y-1">
              {discrepancies.map((d) => (
                <li key={d.wageEntryId}>
                  <Link
                    href={`/paychecks/${d.wageEntryId}/edit`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <p className="font-medium text-foreground">
                      {formatShortDate(d.periodStart)} – {formatShortDate(d.periodEnd)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expected ~${d.expectedGross.toFixed(2)} from hours, got $
                      {d.actualGross.toFixed(2)} ({d.percentDiff}% off)
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
