"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  formatDateInputValue,
  getDefaultShiftDate,
  getWeekdayLabel,
  hoursMinutesToDecimal,
  decimalHoursToParts,
} from "@/lib/shift-entry";
import { inputClass } from "@/lib/form-styles";
import { RequiredMark } from "@/components/required-mark";
import { useRoles } from "@/lib/use-roles";
import { useShifts } from "@/lib/use-shifts";
import type { Shift } from "@/lib/local-data";

// Purely cosmetic — long enough that the spinner reads as "doing something"
// instead of a flicker, short enough not to feel like a real wait.
const SAVE_REDIRECT_DELAY_MS = 600;

interface AddTipsFormProps {
  // Present when editing an existing shift rather than logging a new one.
  initialShift?: Shift;
}

export function AddTipsForm({ initialShift }: AddTipsFormProps) {
  const isEditing = !!initialShift;
  const router = useRouter();
  const { roles } = useRoles();
  const { addShift, updateShift, removeShift } = useShifts();

  // Left blank on first render (server and client agree), then filled in an
  // effect using the browser's local clock — avoids a hydration mismatch
  // from server time/timezone not matching the user's. Skipped entirely
  // when editing, since the shift already has a date.
  const [date, setDate] = useState(initialShift?.date ?? "");
  useEffect(() => {
    if (initialShift) return;
    // Deferring to the client's local clock intentionally — the server has
    // no way to know the user's timezone, so computing this during SSR
    // would produce a wrong default and a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(formatDateInputValue(getDefaultShiftDate(new Date())));
  }, [initialShift]);

  const initialParts = initialShift ? decimalHoursToParts(initialShift.hoursWorked) : null;
  const [amount, setAmount] = useState(
    initialShift ? String(initialShift.tipsAmount) : "",
  );
  const [hours, setHours] = useState(initialParts ? String(initialParts.hours) : "");
  const [minutes, setMinutes] = useState(
    initialParts ? String(initialParts.minutes) : "",
  );
  const [roleId, setRoleId] = useState("");
  const [notes, setNotes] = useState(initialShift?.notes ?? "");
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The roles list loads asynchronously (fetched from Supabase), so match
  // the shift's stored role name to an id once it's available.
  useEffect(() => {
    if (!initialShift?.role) return;
    const match = roles.find((r) => r.name === initialShift.role);
    if (match) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleId(match.id);
    }
  }, [initialShift, roles]);

  const amountNum = Number(amount);
  const hoursNum = Number(hours || 0);
  const minutesNum = Number(minutes || 0);

  const amountValid = amount !== "" && amountNum > 0;
  const durationValid =
    (hoursNum > 0 || minutesNum > 0) &&
    hoursNum >= 0 &&
    hoursNum <= 23 &&
    minutesNum >= 0 &&
    minutesNum <= 59;
  const dateValid = date !== "";

  const weekdayLabel = getWeekdayLabel(date);
  const totalHours = hoursMinutesToDecimal(hoursNum, minutesNum);
  const showRate = amountValid && durationValid;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setAttempted(true);
    setError(null);
    if (!amountValid || !durationValid || !dateValid) return;

    const payload = {
      date,
      hoursWorked: totalHours,
      tipsAmount: Math.round(amountNum * 100) / 100,
      role: roles.find((r) => r.id === roleId)?.name ?? null,
      notes: notes.trim() === "" ? null : notes.trim(),
    };

    setSubmitting(true);
    try {
      if (initialShift) {
        await updateShift(initialShift.id, payload);
      } else {
        await addShift(payload);
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
    if (!initialShift) return;
    if (!window.confirm("Delete this entry? This can't be undone.")) return;
    try {
      await removeShift(initialShift.id);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete — try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="amount" className="text-sm font-medium">
          Total tips
          <RequiredMark />
        </label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={`${inputClass} pl-7`}
            aria-required="true"
          />
        </div>
        {attempted && !amountValid && (
          <p className="mt-1 text-xs text-accent">Enter an amount greater than $0.</p>
        )}
      </div>

      <div>
        <span className="text-sm font-medium">
          Hours worked
          <RequiredMark />
        </span>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              id="hours"
              type="number"
              inputMode="numeric"
              min="0"
              max="23"
              step="1"
              placeholder="0"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              className={`${inputClass} pr-10`}
              aria-label="Hours"
              aria-required="true"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              hr
            </span>
          </div>
          <div className="relative">
            <input
              id="minutes"
              type="number"
              inputMode="numeric"
              min="0"
              max="59"
              step="1"
              placeholder="0"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              className={`${inputClass} pr-10`}
              aria-label="Minutes"
              aria-required="true"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              min
            </span>
          </div>
        </div>
        {attempted && !durationValid && (
          <p className="mt-1 text-xs text-accent">Enter a shift length greater than 0.</p>
        )}
      </div>

      <div>
        <label htmlFor="date" className="text-sm font-medium">
          Date
          <RequiredMark />
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={`${inputClass} mt-1.5`}
          aria-required="true"
        />
        {weekdayLabel && (
          <p className="mt-1.5 text-xs text-muted-foreground">{weekdayLabel}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="text-sm font-medium">
          Role <span className="text-muted-foreground">(optional)</span>
        </label>
        <select
          id="role"
          value={roleId}
          onChange={(event) => setRoleId(event.target.value)}
          className={`${inputClass} mt-1.5`}
        >
          <option value="">No role selected</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        {roles.length === 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            No roles set up yet — add one in{" "}
            <Link href="/settings" className="text-accent hover:underline">
              Settings
            </Link>
            .
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
          placeholder="Slow night, covered a shift, etc."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className={`${inputClass} mt-1.5 resize-none`}
        />
      </div>

      {showRate && (
        <p className="text-sm text-muted-foreground">
          Effective rate:{" "}
          <span className="font-semibold text-foreground">
            ${(amountNum / totalHours).toFixed(2)}/hr
          </span>{" "}
          over {totalHours} hr
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
