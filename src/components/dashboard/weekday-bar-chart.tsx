"use client";

import { useEffect, useState } from "react";
import { SHIFT_TYPE_SERIES, type ShiftSeriesKey, type WeekdayGroup } from "@/lib/dashboard";

interface WeekdayBarChartProps {
  data: WeekdayGroup[];
}

const VIEW_W = 560;
const VIEW_H = 220;
const CHART_LEFT = 40;
const CHART_RIGHT = VIEW_W - 10;
const CHART_TOP = 14;
const CHART_BOTTOM = VIEW_H - 28;
const CHART_W = CHART_RIGHT - CHART_LEFT;
const CHART_H = CHART_BOTTOM - CHART_TOP;
const BAR_MAX_WIDTH = 20;
const BAR_GAP = 2; // dataviz skill's minimum surface gap between adjacent fills — don't go below this
const GROUP_WIDTH_RATIO = 0.94; // fraction of each weekday's slot the bar group fills

// Matches --series-* in globals.css — Tailwind generates fill-series-*
// utilities from those custom properties, so the chart stays theme-aware
// (light/dark) without any dark: variants here.
const SERIES_FILL_CLASS: Record<ShiftSeriesKey, string> = {
  opening: "fill-series-opening",
  bd: "fill-series-bd",
  closing: "fill-series-closing",
  general: "fill-series-general",
};
const SERIES_SWATCH_CLASS: Record<ShiftSeriesKey, string> = {
  opening: "bg-series-opening",
  bd: "bg-series-bd",
  closing: "bg-series-closing",
  general: "bg-series-general",
};

function niceCeil(value: number): number {
  if (value <= 0) return 50;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / (magnitude / 2)) * (magnitude / 2);
}

interface HoverTarget {
  dayIndex: number;
  seriesIndex: number;
}

// Touch has no real hover, so it needs its own interaction model rather than
// reusing the mouse one: a coarse pointer gets big tap-to-toggle zones that
// expand into empty neighboring space (precision isn't there to land on a
// thin bar), while a precise pointer gets zones matching the bar's actual
// width (a mouse expects the tooltip to track exactly what's under the
// cursor — the expanded zones felt wrong here, triggering the wrong bar
// while visually hovering empty space next to it).
function useIsCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCoarse(query.matches);
    const onChange = (event: MediaQueryListEvent) => setIsCoarse(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return isCoarse;
}

export function WeekdayBarChart({ data }: WeekdayBarChartProps) {
  const [hovered, setHovered] = useState<HoverTarget | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Set<ShiftSeriesKey>>(() => new Set());
  const isCoarsePointer = useIsCoarsePointer();

  function toggleSeries(key: ShiftSeriesKey) {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setHovered(null);
  }

  const isVisible = (key: ShiftSeriesKey) => !hiddenSeries.has(key);
  const hasAnyData = data.some((d) => d.totalCount > 0);
  const hasVisibleData = data.some((d) => d.series.some((s) => isVisible(s.key) && s.count > 0));
  const maxAverage = niceCeil(
    Math.max(
      ...data.flatMap((d) => d.series.filter((s) => isVisible(s.key)).map((s) => s.average)),
      0,
    ),
  );

  const slotWidth = CHART_W / data.length;
  const groupWidth = slotWidth * GROUP_WIDTH_RATIO;
  const seriesCount = SHIFT_TYPE_SERIES.length;
  const barWidth = Math.min(
    BAR_MAX_WIDTH,
    (groupWidth - BAR_GAP * (seriesCount - 1)) / seriesCount,
  );

  function yFor(value: number) {
    if (maxAverage === 0) return CHART_BOTTOM;
    return CHART_BOTTOM - (value / maxAverage) * CHART_H;
  }

  if (!hasAnyData) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        No shifts logged in this period yet.
      </div>
    );
  }

  const gridValues = [0, maxAverage / 2, maxAverage];
  const hoveredSeriesEntry = hovered && data[hovered.dayIndex].series[hovered.seriesIndex];
  const hoveredEntry =
    hovered && hoveredSeriesEntry && hoveredSeriesEntry.count > 0 && isVisible(hoveredSeriesEntry.key)
      ? { day: data[hovered.dayIndex], entry: hoveredSeriesEntry }
      : null;

  return (
    <div>
      <div className="relative w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
        {!hasVisibleData && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground">
            All shift types are hidden — click a key below to show one.
          </div>
        )}
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label="Average tips by day of week and shift type"
        >
          {gridValues.map((v) => (
            <line
              key={v}
              x1={CHART_LEFT}
              x2={CHART_RIGHT}
              y1={yFor(v)}
              y2={yFor(v)}
              className="stroke-border"
              strokeWidth={1}
            />
          ))}
          {gridValues.map((v) => (
            <text
              key={v}
              x={CHART_LEFT - 8}
              y={yFor(v)}
              dy="0.32em"
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              ${Math.round(v)}
            </text>
          ))}

          {data.map((d, dayIndex) => {
            const slotCenter = CHART_LEFT + slotWidth * (dayIndex + 0.5);
            const groupLeft = slotCenter - (barWidth * seriesCount + BAR_GAP * (seriesCount - 1)) / 2;
            return (
              <g key={d.label}>
                {d.series.map((entry, seriesIndex) => {
                  const barLeft = groupLeft + seriesIndex * (barWidth + BAR_GAP);
                  const barTop = yFor(entry.average);
                  const barHeight = Math.max(CHART_BOTTOM - barTop, 0);
                  const shown = entry.count > 0 && isVisible(entry.key);
                  const isHovered =
                    hovered?.dayIndex === dayIndex && hovered.seriesIndex === seriesIndex;
                  return (
                    <rect
                      key={entry.key}
                      x={barLeft}
                      y={shown ? barTop : CHART_BOTTOM}
                      width={barWidth}
                      height={shown ? barHeight : 0}
                      rx={3}
                      className={SERIES_FILL_CLASS[entry.key]}
                      opacity={isHovered ? 0.85 : 1}
                    />
                  );
                })}
                <text
                  x={slotCenter}
                  y={CHART_BOTTOM + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute inset-0">
          {data.flatMap((d, dayIndex) => {
            const slotLeft = CHART_LEFT + slotWidth * dayIndex;
            const slotRight = slotLeft + slotWidth;
            const slotCenter = (slotLeft + slotRight) / 2;
            const groupLeft =
              slotCenter - (barWidth * seriesCount + BAR_GAP * (seriesCount - 1)) / 2;

            // Only real bars get a hit target — on touch its bounds expand
            // to the midpoint to its neighbors (or the slot edge, for the
            // first/last), since most days only have one or two shift types
            // logged and precision isn't there anyway; on a precise pointer
            // it's exactly the bar's own width, so the tooltip only ever
            // tracks what's actually under the cursor.
            const present = d.series
              .map((entry, seriesIndex) => {
                const barLeft = groupLeft + seriesIndex * (barWidth + BAR_GAP);
                return { entry, seriesIndex, barLeft, barRight: barLeft + barWidth };
              })
              .filter(({ entry }) => entry.count > 0 && isVisible(entry.key));

            return present.map((p, i) => {
              const prevRight = i > 0 ? present[i - 1].barRight : slotLeft;
              const nextLeft = i < present.length - 1 ? present[i + 1].barLeft : slotRight;
              const hitLeft = isCoarsePointer ? (p.barLeft + prevRight) / 2 : p.barLeft;
              const hitRight = isCoarsePointer ? (p.barRight + nextLeft) / 2 : p.barRight;
              const isHovered =
                hovered?.dayIndex === dayIndex && hovered.seriesIndex === p.seriesIndex;
              const target = { dayIndex, seriesIndex: p.seriesIndex };
              return (
                <button
                  key={`${d.label}-${p.entry.key}`}
                  type="button"
                  {...(isCoarsePointer
                    ? {
                        onClick: () => setHovered(isHovered ? null : target),
                      }
                    : {
                        onPointerEnter: () => setHovered(target),
                        onPointerLeave: () => setHovered((h) => (isHovered ? null : h)),
                        onFocus: () => setHovered(target),
                        onBlur: () => setHovered((h) => (isHovered ? null : h)),
                      })}
                  className="absolute top-0 h-full cursor-default"
                  style={{
                    left: `${(hitLeft / VIEW_W) * 100}%`,
                    width: `${((hitRight - hitLeft) / VIEW_W) * 100}%`,
                    touchAction: "manipulation",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                  aria-label={`${d.label} ${p.entry.label}: $${p.entry.average.toFixed(2)} average over ${p.entry.count} shift${p.entry.count === 1 ? "" : "s"}`}
                />
              );
            });
          })}
        </div>

        {hoveredEntry && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm"
            style={{
              left: `${((hovered!.dayIndex + 0.5) / data.length) * 100}%`,
              top: `${(Math.max(CHART_TOP, yFor(hoveredEntry.entry.average)) / VIEW_H) * 100}%`,
              marginTop: -8,
            }}
          >
            <p className="font-semibold text-foreground">
              ${hoveredEntry.entry.average.toFixed(2)} avg
            </p>
            <p className="text-muted-foreground">
              {hoveredEntry.day.label} · {hoveredEntry.entry.label} ·{" "}
              {hoveredEntry.entry.count} shift{hoveredEntry.entry.count === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {SHIFT_TYPE_SERIES.map((s) => {
          const visible = isVisible(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key)}
              aria-pressed={visible}
              aria-label={`${visible ? "Hide" : "Show"} ${s.label} in chart`}
              className="flex cursor-pointer items-center gap-1.5"
            >
              <span
                className={`size-2.5 rounded-full ${SERIES_SWATCH_CLASS[s.key]}`}
                style={{ opacity: visible ? 1 : 0.3 }}
              />
              <span
                className={`text-xs ${visible ? "text-muted-foreground" : "text-muted-foreground/40 line-through"}`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
