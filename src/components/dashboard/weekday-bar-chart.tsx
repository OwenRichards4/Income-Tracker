"use client";

import { useState } from "react";
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

export function WeekdayBarChart({ data }: WeekdayBarChartProps) {
  const [hovered, setHovered] = useState<HoverTarget | null>(null);

  const hasData = data.some((d) => d.totalCount > 0);
  const maxAverage = niceCeil(
    Math.max(...data.flatMap((d) => d.series.map((s) => s.average)), 0),
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

  if (!hasData) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        No shifts logged in this period yet.
      </div>
    );
  }

  const gridValues = [0, maxAverage / 2, maxAverage];
  const hoveredEntry =
    hovered && data[hovered.dayIndex].series[hovered.seriesIndex].count > 0
      ? { day: data[hovered.dayIndex], entry: data[hovered.dayIndex].series[hovered.seriesIndex] }
      : null;

  return (
    <div>
      <div className="relative w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
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
                  const isHovered =
                    hovered?.dayIndex === dayIndex && hovered.seriesIndex === seriesIndex;
                  return (
                    <rect
                      key={entry.key}
                      x={barLeft}
                      y={entry.count > 0 ? barTop : CHART_BOTTOM}
                      width={barWidth}
                      height={entry.count > 0 ? barHeight : 0}
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

        <div className="absolute inset-0 flex">
          {data.map((d, dayIndex) => (
            <div key={d.label} className="relative flex h-full flex-1">
              {d.series.map((entry, seriesIndex) => (
                <button
                  key={entry.key}
                  type="button"
                  tabIndex={entry.count > 0 ? 0 : -1}
                  onPointerEnter={() => setHovered({ dayIndex, seriesIndex })}
                  onPointerLeave={() =>
                    setHovered((h) =>
                      h?.dayIndex === dayIndex && h.seriesIndex === seriesIndex ? null : h,
                    )
                  }
                  onFocus={() => setHovered({ dayIndex, seriesIndex })}
                  onBlur={() =>
                    setHovered((h) =>
                      h?.dayIndex === dayIndex && h.seriesIndex === seriesIndex ? null : h,
                    )
                  }
                  className="h-full flex-1 cursor-default"
                  aria-label={`${d.label} ${entry.label}: ${
                    entry.count > 0
                      ? `$${entry.average.toFixed(2)} average over ${entry.count} shift${entry.count === 1 ? "" : "s"}`
                      : "no shifts"
                  }`}
                />
              ))}
            </div>
          ))}
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
        {SHIFT_TYPE_SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${SERIES_SWATCH_CLASS[s.key]}`} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
