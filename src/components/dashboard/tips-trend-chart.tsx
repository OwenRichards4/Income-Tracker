"use client";

import { useState } from "react";
import type { WeeklyTrendPoint } from "@/lib/dashboard";

interface TipsTrendChartProps {
  data: WeeklyTrendPoint[];
}

const VIEW_W = 560;
const VIEW_H = 220;
const CHART_LEFT = 40;
const CHART_RIGHT = VIEW_W - 10;
const CHART_TOP = 14;
const CHART_BOTTOM = VIEW_H - 28;
const CHART_W = CHART_RIGHT - CHART_LEFT;
const CHART_H = CHART_BOTTOM - CHART_TOP;

function niceCeil(value: number): number {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / (magnitude / 2)) * (magnitude / 2);
}

function formatWeekLabel(weekStart: string): string {
  const [, month, day] = weekStart.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function TipsTrendChart({ data }: TipsTrendChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        No shifts logged in this period yet.
      </div>
    );
  }

  const maxRate = niceCeil(Math.max(...data.map((d) => d.rate), 0));
  const slotWidth = data.length > 1 ? CHART_W / (data.length - 1) : 0;

  function xFor(i: number) {
    return data.length > 1 ? CHART_LEFT + slotWidth * i : (CHART_LEFT + CHART_RIGHT) / 2;
  }
  function yFor(rate: number) {
    return maxRate === 0 ? CHART_BOTTOM : CHART_BOTTOM - (rate / maxRate) * CHART_H;
  }

  const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.rate) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${CHART_BOTTOM} L${points[0].x},${CHART_BOTTOM} Z`;

  const gridValues = [0, maxRate / 2, maxRate];
  const last = data.length - 1;

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="Tips per hour, weekly trend"
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

        <path d={areaPath} className="fill-accent" opacity={0.1} />
        <path
          d={linePath}
          fill="none"
          className="stroke-accent"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hovered !== null && (
          <line
            x1={points[hovered].x}
            x2={points[hovered].x}
            y1={CHART_TOP}
            y2={CHART_BOTTOM}
            className="stroke-muted-foreground"
            strokeWidth={1}
            opacity={0.4}
          />
        )}

        {/* End-of-line marker + direct label, per "lines label the endpoint". */}
        <circle
          cx={points[last].x}
          cy={points[last].y}
          r={5}
          className="fill-accent stroke-card"
          strokeWidth={2}
        />
        <text
          x={points[last].x}
          y={points[last].y - 12}
          textAnchor="end"
          className="fill-foreground text-[11px] font-semibold"
        >
          ${data[last].rate.toFixed(2)}/hr
        </text>

        {hovered !== null && hovered !== last && (
          <circle
            cx={points[hovered].x}
            cy={points[hovered].y}
            r={5}
            className="fill-accent stroke-card"
            strokeWidth={2}
          />
        )}

        {data.map((d, i) =>
          i % Math.ceil(data.length / 6) === 0 ? (
            <text
              key={d.weekStart}
              x={xFor(i)}
              y={CHART_BOTTOM + 16}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formatWeekLabel(d.weekStart)}
            </text>
          ) : null,
        )}
      </svg>

      <div className="absolute inset-0 flex">
        {data.map((d, i) => (
          <button
            key={d.weekStart}
            type="button"
            tabIndex={0}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered((h) => (h === i ? null : h))}
            className="h-full flex-1 cursor-default"
            aria-label={`Week of ${formatWeekLabel(d.weekStart)}: $${d.rate.toFixed(2)} per hour`}
          />
        ))}
      </div>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            left: `${(points[hovered].x / VIEW_W) * 100}%`,
            top: `${(Math.max(CHART_TOP, points[hovered].y) / VIEW_H) * 100}%`,
            marginTop: -8,
          }}
        >
          <p className="font-semibold text-foreground">${data[hovered].rate.toFixed(2)}/hr</p>
          <p className="text-muted-foreground">Week of {formatWeekLabel(data[hovered].weekStart)}</p>
        </div>
      )}
    </div>
  );
}
