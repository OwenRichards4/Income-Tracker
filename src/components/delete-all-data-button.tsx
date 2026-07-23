"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { deleteAllData } from "@/app/settings/account-actions";

export function DeleteAllDataButton() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmedDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteAllData();
      // Hard navigation, not router.push — every hook's shared client-side
      // store (useShifts, useWageEntries, useRoles, useTaxSettings) still
      // holds the now-deleted data in memory, and a full reload is the
      // simplest way to guarantee nothing stale renders after a wipe this
      // total.
      window.location.href = "/";
    } catch (err) {
      setDeleting(false);
      setError(err instanceof Error ? err.message : "Couldn't delete — try again.");
    }
  }

  if (confirming) {
    return (
      <div className="rounded-lg border border-accent p-3">
        <p className="text-sm font-medium text-foreground">
          Delete everything? This can&apos;t be undone.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Every tip, paycheck, and role on this account will be permanently
          removed. You&apos;ll still be able to sign back in afterward, to an
          empty account.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={handleConfirmedDelete}
            disabled={deleting}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {deleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {deleting ? "Deleting…" : "Yes, delete everything"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-accent">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="cursor-pointer rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      Delete all data
    </button>
  );
}
