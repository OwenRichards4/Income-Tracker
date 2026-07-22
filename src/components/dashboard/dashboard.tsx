"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShifts } from "@/lib/use-shifts";
import { useWageEntries } from "@/lib/use-wage-entries";
import {
  type Period,
  getPeriodRange,
  getPreviousPeriodRange,
  advancePeriod,
  formatRangeLabel,
  filterShiftsByRange,
  filterWageEntriesByRange,
  sumTips,
  averageTipsByWeekday,
  weeklyTipsPerHourTrend,
  sumTipsByRole,
} from "@/lib/dashboard";
import { formatDateInputValue } from "@/lib/shift-entry";
import { estimateTaxOwed } from "@/lib/tax/estimate";
import { MetricCard } from "./metric-card";
import { WeekdayBarChart } from "./weekday-bar-chart";
import { TipsTrendChart } from "./tips-trend-chart";
import { RecentEntriesTable } from "./recent-entries-table";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "all", label: "All" },
];

const PERIOD_NOUN: Record<Period, string> = {
  week: "last week",
  month: "last month",
  year: "last year",
  all: "",
};

// Placeholders until Settings/auth are real and these come from the
// account's `settings` row instead.
const FICA_RATE = 0.0765;
const ESTIMATED_INCOME_TAX_RATE = 0.12;
const WEEK_START_DAY = 1; // Monday — the actual work week runs Mon-Sun

export function Dashboard() {
  // Deferred to the client's local clock — see the same pattern (and the
  // reason for it) in AddTipsForm.
  const [todayISO, setTodayISO] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayISO(formatDateInputValue(new Date()));
  }, []);

  const [period, setPeriod] = useState<Period>("month");
  // null means "viewing the present" — falls back to todayISO. Set to an
  // explicit date once the user navigates away via the prev/next arrows.
  const [viewDateISO, setViewDateISO] = useState<string | null>(null);

  const { shifts: allShifts, loaded: shiftsLoaded } = useShifts();
  const { wageEntries: allWageEntries, loaded: wageEntriesLoaded } = useWageEntries();

  if (!todayISO || !shiftsLoaded || !wageEntriesLoaded) {
    return (
      <div className="mt-6 h-[420px] animate-pulse rounded-xl border border-border bg-card" />
    );
  }

  const viewDate = viewDateISO ?? todayISO;
  const isPresent = viewDate === todayISO;

  const range = getPeriodRange(period, viewDate, WEEK_START_DAY);
  const shifts = filterShiftsByRange(allShifts, range);
  const wageEntries = filterWageEntriesByRange(allWageEntries, range);
  // Disabled once the viewed range reaches today — nothing in the future
  // has happened yet, so there's no valid "next" period beyond the present.
  const nextDisabled = period === "all" || (range.end !== null && range.end >= todayISO);

  const totalTips = sumTips(shifts);
  const tax = estimateTaxOwed({
    totalTips,
    ficaRate: FICA_RATE,
    estimatedIncomeTaxRate: ESTIMATED_INCOME_TAX_RATE,
  });
  const totalHours = shifts.reduce((sum, s) => sum + s.hoursWorked, 0);
  const effectiveRate = totalHours > 0 ? totalTips / totalHours : 0;

  let delta: { label: string; direction: "up" | "down" | "flat" } | undefined;
  const prevRange = getPreviousPeriodRange(period, viewDate, WEEK_START_DAY);
  if (prevRange) {
    const prevTips = sumTips(filterShiftsByRange(allShifts, prevRange));
    if (prevTips > 0) {
      const changePct = ((totalTips - prevTips) / prevTips) * 100;
      delta = {
        direction: changePct > 0.5 ? "up" : changePct < -0.5 ? "down" : "flat",
        label: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(0)}% vs ${PERIOD_NOUN[period]}`,
      };
    }
  }

  const weekdayAverages = averageTipsByWeekday(shifts, WEEK_START_DAY);
  const trend = weeklyTipsPerHourTrend(shifts, WEEK_START_DAY);
  const roleTotals = sumTipsByRole(shifts);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setPeriod(p.key);
                setViewDateISO(null);
              }}
              aria-pressed={period === p.key}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p.key
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period !== "all" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewDateISO(advancePeriod(period, viewDate, -1))}
              aria-label={`Previous ${period}`}
              className="cursor-pointer rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[9ch] text-center text-sm font-medium text-foreground">
              {formatRangeLabel(period, range)}
            </span>
            <button
              type="button"
              onClick={() => setViewDateISO(advancePeriod(period, viewDate, 1))}
              disabled={nextDisabled}
              aria-label={`Next ${period}`}
              className="cursor-pointer rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
            {!isPresent && (
              <button
                type="button"
                onClick={() => setViewDateISO(null)}
                className="cursor-pointer text-xs font-medium text-accent hover:underline"
              >
                Today
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Take-home estimate"
          value={`$${tax.takeHomeEstimate.toFixed(2)}`}
        />
        <MetricCard
          label="Effective rate"
          value={totalHours > 0 ? `$${effectiveRate.toFixed(2)}/hr` : "—"}
        />
        <MetricCard
          label="Total income"
          value={`$${totalTips.toFixed(2)}`}
          tone="positive"
          delta={delta}
        />
        <MetricCard
          label="Est. tax owed"
          value={`$${tax.totalOwed.toFixed(2)}`}
          tone="negative"
        />
      </div>

      {roleTotals.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground">By role</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {roleTotals.map((r) => (
              <div
                key={r.role}
                className="rounded-lg bg-muted px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{r.role}</span>{" "}
                <span className="text-muted-foreground">
                  · ${r.total.toFixed(2)} · {r.count} shift{r.count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground">
            Average tips by day of week
          </h2>
          <div className="mt-4">
            <WeekdayBarChart data={weekdayAverages} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground">
            Tips per hour, weekly trend
          </h2>
          <div className="mt-4">
            <TipsTrendChart data={trend} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-foreground">Recent entries</h2>
        <div className="mt-4">
          <RecentEntriesTable shifts={shifts} wageEntries={wageEntries} />
        </div>
      </div>

    </div>
  );
}
