"use client";

import { useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";

export type MetricPoint = {
  t: string; // ISO timestamp
  v: number;
};

type Tone = "brand" | "accent" | "warn" | "neutral";

function toneColor(tone: Tone): string {
  if (tone === "accent") {
    return "var(--kw-chart-2)";
  }
  if (tone === "warn") {
    return "var(--kw-chart-3)";
  }
  if (tone === "neutral") {
    return "rgba(11,18,32,0.35)";
  }
  return "var(--kw-chart-1)";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AreaTrend(props: {
  points: MetricPoint[];
  tone?: Tone;
  height?: number;
  className?: string;
  valueSuffix?: string;
}) {
  const tone = props.tone ?? "brand";
  const color = toneColor(tone);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `kw_area_${tone}_${uid}`;
  const height = props.height ?? 140;
  const width = 520;
  const padding = 10;

  const fallback = useMemo(() => [{ t: new Date().toISOString(), v: 0 }], []);
  const safe = props.points.length ? props.points : fallback;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const geometry = useMemo(() => {
    const min = Math.min(...safe.map((p) => p.v));
    const max = Math.max(...safe.map((p) => p.v));
    const span = max - min || 1;

    const pts = safe.map((p, i) => {
      const x = padding + (i * (width - padding * 2)) / Math.max(1, safe.length - 1);
      const y = padding + ((max - p.v) * (height - padding * 2)) / span;
      return { x, y };
    });

    const line = `M ${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L ")}`;
    const area = `${line} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

    return { pts, min, max, line, area };
  }, [height, safe]);

  const hovered = hoverIndex !== null ? safe[Math.max(0, Math.min(hoverIndex, safe.length - 1))] : null;
  const hoveredPt = hoverIndex !== null ? geometry.pts[Math.max(0, Math.min(hoverIndex, geometry.pts.length - 1))] : null;

  return (
    <div
      ref={rootRef}
      className={clsx("relative w-full", props.className)}
      onMouseLeave={() => setHoverIndex(null)}
      onMouseMove={(event) => {
        const rect = rootRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        const x = event.clientX - rect.left;
        const normalized = (x - padding) / (rect.width - padding * 2);
        const i = Math.round(normalized * (safe.length - 1));
        setHoverIndex(Math.max(0, Math.min(safe.length - 1, i)));
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
            <stop stopColor={color} stopOpacity="0.32" />
            <stop offset="1" stopColor={color} stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <path d={geometry.area} fill={`url(#${gradientId})`} />
        <path d={geometry.line} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* subtle baseline */}
        <path
          d={`M ${padding} ${height - padding} L ${width - padding} ${height - padding}`}
          stroke="rgba(11,18,32,0.10)"
          strokeWidth="1"
        />

        {hoveredPt ? (
          <>
            <line
              x1={hoveredPt.x}
              x2={hoveredPt.x}
              y1={padding}
              y2={height - padding}
              stroke="rgba(11,18,32,0.12)"
              strokeWidth="1"
            />
            <circle cx={hoveredPt.x} cy={hoveredPt.y} r="5" fill="white" stroke={color} strokeWidth="2" />
          </>
        ) : null}
      </svg>

      {hovered && hoveredPt ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/85 px-3 py-2 text-xs shadow-[var(--kw-shadow-soft)] backdrop-blur"
          style={{
            left: `${(hoveredPt.x / width) * 100}%`,
            top: "8px",
          }}
        >
          <p className="font-semibold text-[color:var(--kw-ink)]">
            {hovered.v}
            {props.valueSuffix ?? ""}
          </p>
          <p className="text-[color:var(--kw-muted)]">{formatDate(hovered.t)}</p>
        </div>
      ) : null}
    </div>
  );
}
