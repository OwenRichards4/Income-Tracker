"use client";

import { useEffect, useState } from "react";
import { useTaxSettings } from "@/lib/use-tax-settings";
import { inputClass } from "@/lib/form-styles";

export function TaxSettingsManager() {
  const { taxSettings, loaded, setIncomeTaxRate } = useTaxSettings();
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Populate the input once the real value loads, without clobbering
  // whatever the user's actively typing.
  useEffect(() => {
    if (taxSettings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRate(String(Math.round(taxSettings.estimatedIncomeTaxRate * 10000) / 100));
    }
  }, [taxSettings]);

  const rateNum = Number(rate);
  const rateValid = rate !== "" && rateNum >= 0 && rateNum <= 100;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (!rateValid) return;
    setSubmitting(true);
    try {
      await setIncomeTaxRate(rateNum / 100);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded || !taxSettings) {
    return <div className="h-24 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSave}>
        <label htmlFor="income-tax-rate" className="text-sm font-medium">
          Income tax rate
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Your estimated marginal federal + state income tax rate. Used to project
          how much of your tips you&apos;ll owe at tax time — adjust it to match your
          actual bracket and state. Defaults to 12%, a typical federal marginal rate.
        </p>
        <div className="mt-2 flex items-end gap-2">
          <div className="relative w-28">
            <input
              id="income-tax-rate"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="100"
              value={rate}
              onChange={(event) => {
                setRate(event.target.value);
                setSaved(false);
              }}
              className={`${inputClass} pr-7`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
          <button
            type="submit"
            disabled={submitting || !rateValid}
            className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
        {!rateValid && rate !== "" && (
          <p className="mt-1.5 text-xs text-accent">Enter a rate between 0 and 100.</p>
        )}
        {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
        {saved && !error && (
          <p className="mt-1.5 text-xs text-muted-foreground">Saved.</p>
        )}
      </form>

      <div>
        <p className="text-sm font-medium">FICA rate</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Social Security + Medicare — a fixed {(taxSettings.ficaRate * 100).toFixed(2)}%
          set by federal law, applied to all tip income regardless of bracket. Not
          user-editable; stored so it can be updated app-wide if the rate ever
          changes, not per person.
        </p>
      </div>
    </div>
  );
}
