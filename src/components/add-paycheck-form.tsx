"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { inputClass } from "@/lib/form-styles";
import { RequiredMark } from "@/components/required-mark";
import { useWageEntries } from "@/lib/use-wage-entries";
import type { WageEntry } from "@/lib/local-data";

// Purely cosmetic — long enough that the spinner reads as "doing something"
// instead of a flicker, short enough not to feel like a real wait.
const SAVE_REDIRECT_DELAY_MS = 600;

interface AddPaycheckFormProps {
  // Present when editing an existing entry rather than logging a new one.
  initialEntry?: WageEntry;
}

export function AddPaycheckForm({ initialEntry }: AddPaycheckFormProps) {
  const isEditing = !!initialEntry;
  const router = useRouter();
  const { addWageEntry, updateWageEntry, removeWageEntry } = useWageEntries();

  // "Check amount" is what actually landed in hand (net pay) — the number
  // printed on the check. Gross (total earned before tax) is derived from
  // this plus what was withheld, not entered directly.
  const [checkAmount, setCheckAmount] = useState(
    initialEntry ? String(initialEntry.netPay) : "",
  );
  const [withheld, setWithheld] = useState(
    initialEntry
      ? String(Math.round((initialEntry.grossPay - initialEntry.netPay) * 100) / 100)
      : "",
  );
  const [periodStart, setPeriodStart] = useState(initialEntry?.periodStart ?? "");
  const [periodEnd, setPeriodEnd] = useState(initialEntry?.periodEnd ?? "");
  const [notes, setNotes] = useState(initialEntry?.notes ?? "");
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAmountNum = Number(checkAmount);
  const withheldNum = Number(withheld);

  const checkAmountValid = checkAmount !== "" && checkAmountNum > 0;
  const withheldValid = withheld !== "" && withheldNum >= 0;
  // "YYYY-MM-DD" strings compare chronologically as plain strings.
  const periodValid =
    periodStart !== "" && periodEnd !== "" && periodEnd >= periodStart;

  const showGross = checkAmountValid && withheldValid;
  const grossPay = checkAmountNum + withheldNum;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setAttempted(true);
    setError(null);
    if (!checkAmountValid || !withheldValid || !periodValid) return;

    const payload = {
      periodStart,
      periodEnd,
      grossPay: Math.round(grossPay * 100) / 100,
      netPay: Math.round(checkAmountNum * 100) / 100,
      notes: notes.trim() === "" ? null : notes.trim(),
    };

    setSubmitting(true);
    try {
      if (initialEntry) {
        await updateWageEntry(initialEntry.id, payload);
      } else {
        await addWageEntry(payload);
      }
      // Brief delay before returning to the dashboard so the save doesn't
      // feel instant/silent — gives the entry a moment to land before it's
      // back in view at the top of Recent entries.
      await new Promise((resolve) => window.setTimeout(resolve, SAVE_REDIRECT_DELAY_MS));
      router.push("/");
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Couldn't save — try again.");
    }
  }

  async function handleDelete() {
    if (!initialEntry) return;
    if (!window.confirm("Delete this entry? This can't be undone.")) return;
    try {
      await removeWageEntry(initialEntry.id);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete — try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="check-amount" className="text-sm font-medium">
          Check amount
          <RequiredMark />
        </label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <input
            id="check-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={checkAmount}
            onChange={(event) => setCheckAmount(event.target.value)}
            className={`${inputClass} pl-7`}
            aria-required="true"
          />
        </div>
        {attempted && !checkAmountValid && (
          <p className="mt-1 text-xs text-accent">
            Enter an amount greater than $0.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="withheld" className="text-sm font-medium">
          Total withheld (taxed)
          <RequiredMark />
        </label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <input
            id="withheld"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={withheld}
            onChange={(event) => setWithheld(event.target.value)}
            className={`${inputClass} pl-7`}
            aria-required="true"
          />
        </div>
        {attempted && !withheldValid && (
          <p className="mt-1 text-xs text-accent">
            Enter an amount of $0 or more.
          </p>
        )}
      </div>

      <div>
        <span className="text-sm font-medium">
          Pay period
          <RequiredMark />
        </span>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <div>
            <input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              className={inputClass}
              aria-label="Period start"
              aria-required="true"
            />
            <p className="mt-1 text-xs text-muted-foreground">Start</p>
          </div>
          <div>
            <input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className={inputClass}
              aria-label="Period end"
              aria-required="true"
            />
            <p className="mt-1 text-xs text-muted-foreground">End</p>
          </div>
        </div>
        {attempted && !periodValid && (
          <p className="mt-1 text-xs text-accent">
            {periodStart && periodEnd && periodEnd < periodStart
              ? "End date must be on or after the start date."
              : "Enter both a start and end date."}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="text-sm font-medium">
          Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={2}
          placeholder="Missing overtime, following up with manager, etc."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className={`${inputClass} mt-1.5 resize-none`}
        />
      </div>

      {showGross && (
        <p className="text-sm text-muted-foreground">
          Total earned (before tax):{" "}
          <span className="font-semibold text-foreground">
            ${grossPay.toFixed(2)}
          </span>
        </p>
      )}

      {error && <p className="text-sm text-accent">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full cursor-pointer rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="inline-flex items-center justify-center gap-2">
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Saving…" : isEditing ? "Save changes" : "Save"}
        </span>
      </button>

      {isEditing && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="w-full cursor-pointer rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-70"
        >
          Delete entry
        </button>
      )}
    </form>
  );
}
