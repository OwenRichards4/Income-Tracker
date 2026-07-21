import Link from "next/link";
import { LogOut, Plus, Settings } from "lucide-react";
import { PayrollWarning } from "@/components/payroll-warning";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold">
          Finance Tracker
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {user && (
            <>
              <Link
                href="/shifts/new"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" />
                Add Tips
              </Link>
              <Link
                href="/paychecks/new"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Plus className="size-4" />
                Add Paycheck
              </Link>
              <PayrollWarning />
              <Link
                href="/settings"
                aria-label="Settings"
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings className="size-5" />
              </Link>
            </>
          )}
          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                aria-label={`Sign out (${user.email})`}
                title={user.email ?? undefined}
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-5" />
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
