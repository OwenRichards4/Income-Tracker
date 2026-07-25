interface MetricCardProps {
  label: string;
  value: string;
  // Recolors the headline value itself — for cards whose number is inherently
  // good news (income) or a cost (tax owed), not just a neutral stat.
  tone?: "positive" | "negative";
  delta?: {
    label: string;
    direction: "up" | "down" | "flat";
  };
}

// Both value colors below are contrast-checked against this app's light
// (#ffffff) and dark (#1a2436) card surfaces, clearing WCAG's large-text
// 3:1 bar in both — this text is text-2xl/font-semibold, which qualifies as
// "large" so 3:1 (not 4.5:1) applies. `negative` reuses the app's own
// dark-mode destructive red rather than a new hex — it's visibly lighter
// than the light-mode destructive red (#dc2626, see --destructive in
// globals.css) already used for delete buttons/errors, which is the
// "lighter red" this was asked for, without introducing a color the
// palette doesn't already have.
const TONE_CLASS: Record<"positive" | "negative", string> = {
  positive: "text-[#0ca30c]",
  negative: "text-[#ef4444]",
};

// Stat tile: label, value, optional signed delta vs a named prior period.
// For the delta arrow, only "up" gets a color (green) — "down" stays neutral
// gray rather than red, to avoid a wall of alarming red every time a number
// dips vs. last period. (`tone` above is a separate, deliberate exception
// for cards where the value itself — not a change over time — is inherently
// good/bad news.)
export function MetricCard({ label, value, tone, delta }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-1.5 text-2xl font-semibold ${tone ? TONE_CLASS[tone] : "text-foreground"}`}
      >
        {value}
      </p>
      {delta && (
        <p
          className={`mt-1 text-xs font-medium ${
            delta.direction === "up" ? "text-[#0ca30c]" : "text-muted-foreground"
          }`}
        >
          {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "—"}{" "}
          {delta.label}
        </p>
      )}
    </div>
  );
}
