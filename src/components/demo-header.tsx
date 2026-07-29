import Link from "next/link";
import { Plus } from "lucide-react";
import { PayrollWarning } from "@/components/payroll-warning";

// Same shape as SiteHeader, but never touches Supabase — everything here is
// always "signed in" to the seeded demo data, so there's no user/loading
// branch to render. Deliberately drops Settings and the QR share button:
// neither makes sense with no real account behind them.
export function DemoHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/demo" className="text-lg font-semibold">
          Finance Tracker
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Demo — nothing saved
          </span>
          <Link
            href="/demo/shifts/new"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Add Tips
          </Link>
          <Link
            href="/demo/paychecks/new"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-4" />
            Add Paycheck
          </Link>
          <PayrollWarning />
          <Link
            href="/login"
            className="inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Sign in for real
          </Link>
        </div>
      </div>
    </header>
  );
}
