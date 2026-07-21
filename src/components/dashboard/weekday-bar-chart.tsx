"use client";

import { useState } from "react";
import type { WeekdayAverage } from "@/lib/dashboard";

interface WeekdayBarChartProps {
  data: WeekdayAverage[];
}

const VIEW_W = 560;
const VIEW_H = 220;
const CHART_LEFT = 40;
const CHART_RIGHT = VIEW_W - 10;
const CHART_TOP = 14;
const CHART_BOTTOM = VIEW_H - 28;
const CHART_W = CHART_RIGHT - CHART_LEFT;
const CHART_H = CHART_BOTTOM - CHART_TOP;
const BAR_MAX_THICKNESS = 24;

function niceCeil(value: number): number {
  if (value <= 0) return 50;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / (magnitude / 2)) * (magnitude / 2);
}

export function WeekdayBarChart({ data }: WeekdayBarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const hasData = data.some((d) => d.count > 0);
  const maxAverage = niceCeil(Math.max(...data.map((d) => d.average), 0));
  const maxIndex = data.reduce(
    (best, d, i) => (d.average > data[best].average ? i : best),
    0,
  );

  const slotWidth = CHART_W / data.length;
  const barWidth = Math.min(BAR_MAX_THICKNESS, slotWidth * 0.55);

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

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="Average tips by day of week"
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

        {data.map((d, i) => {
          const cx = CHART_LEFT + slotWidth * (i + 0.5);
          const barTop = yFor(d.average);
          const barHeight = Math.max(CHART_BOTTOM - barTop, 0);
          const isHovered = hovered === i;
          return (
            <g key={d.label}>
              <rect
                x={cx - barWidth / 2}
                y={barTop}
                width={barWidth}
                height={barHeight}
                rx={4}
                className="fill-accent"
                opacity={isHovered ? 0.85 : 1}
              />
              {i === maxIndex && d.average > 0 && (
                <text
                  x={cx}
                  y={barTop - 6}
                  textAnchor="middle"
                  className="fill-foreground text-[11px] font-semibold"
                >
                  ${d.average.toFixed(2)}
                </text>
              )}
              <text
                x={cx}
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
        {data.map((d, i) => (
          <button
            key={d.label}
            type="button"
            tabIndex={d.count > 0 ? 0 : -1}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered((h) => (h === i ? null : h))}
            className="h-full flex-1 cursor-default"
            aria-label={`${d.label}: ${d.count > 0 ? `$${d.average.toFixed(2)} average over ${d.count} shift${d.count === 1 ? "" : "s"}` : "no shifts"}`}
          />
        ))}
      </div>

      {hovered !== null && data[hovered].count > 0 && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            left: `${((hovered + 0.5) / data.length) * 100}%`,
            top: `${(Math.max(CHART_TOP, yFor(data[hovered].average)) / VIEW_H) * 100}%`,
            marginTop: -8,
          }}
        >
          <p className="font-semibold text-foreground">
            ${data[hovered].average.toFixed(2)} avg
          </p>
          <p className="text-muted-foreground">
            {data[hovered].label} · {data[hovered].count} shift
            {data[hovered].count === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
