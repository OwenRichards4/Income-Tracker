interface MetricCardProps {
  label: string;
  value: string;
  delta?: {
    label: string;
    direction: "up" | "down" | "flat";
  };
}

// Stat tile: label, value, optional signed delta vs a named prior period.
// Only "up" gets a color (green) — "down" stays neutral gray rather than
// red, since red is this app's brand/action color and doubling it as a
// bad-news signal would collide with the Add Tips button etc.
export function MetricCard({ label, value, delta }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
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
