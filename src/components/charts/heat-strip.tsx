"use client";

import { useMemo, useRef, useState } from "react";
import clsx from "clsx";

type Tone = "brand" | "accent" | "warn" | "neutral";

function toneRamp(tone: Tone): string[] {
  if (tone === "accent") {
    return [
      "rgba(var(--kw-accent-rgb),0.10)",
      "rgba(var(--kw-accent-rgb),0.18)",
      "rgba(var(--kw-accent-rgb),0.28)",
      "rgba(var(--kw-accent-rgb),0.40)",
    ];
  }
  if (tone === "warn") {
    return ["rgba(234,88,12,0.10)", "rgba(234,88,12,0.18)", "rgba(234,88,12,0.28)", "rgba(234,88,12,0.42)"];
  }
  if (tone === "neutral") {
    return ["rgba(11,18,32,0.06)", "rgba(11,18,32,0.10)", "rgba(11,18,32,0.14)", "rgba(11,18,32,0.20)"];
  }
  return ["rgba(10,138,119,0.10)", "rgba(10,138,119,0.18)", "rgba(10,138,119,0.28)", "rgba(10,138,119,0.42)"];
}

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    return iso;
  }
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function HeatStrip(props: {
  days: Array<{ date: string; value: number }>;
  tone?: Tone;
  className?: string;
  ariaLabel?: string;
}) {
  const tone = props.tone ?? "brand";
  const ramp = toneRamp(tone);
  const cell = 10;
  const gap = 4;
  const rows = 7;

  const fallback = useMemo(() => [] as Array<{ date: string; value: number }>, []);
  const days = props.days.length ? props.days : fallback;
  const cols = Math.ceil(days.length / rows);
  const width = cols * (cell + gap) - gap;
  const height = rows * (cell + gap) - gap;

  const max = useMemo(() => Math.max(1, ...days.map((d) => d.value)), [days]);
  const [hovered, setHovered] = useState<{ date: string; value: number; x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  function colorFor(v: number): string {
    if (v <= 0) {
      return "rgba(11,18,32,0.06)";
    }
    const pct = v / max;
    if (pct < 0.34) {
      return ramp[1]!;
    }
    if (pct < 0.67) {
      return ramp[2]!;
    }
    return ramp[3]!;
  }

  return (
    <div
      ref={rootRef}
      className={clsx("relative w-full", props.className)}
      onMouseLeave={() => setHovered(null)}
    >
      <svg
        viewBox={`0 0 ${Math.max(1, width)} ${Math.max(1, height)}`}
        className="block w-full"
        role="img"
        aria-label={props.ariaLabel ?? "Activity heatmap"}
      >
        {days.map((d, idx) => {
          const r = idx % rows;
          const c = Math.floor(idx / rows);
          const x = c * (cell + gap);
          const y = r * (cell + gap);
          return (
            <rect
              key={`${d.date}_${idx}`}
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx="3"
              fill={colorFor(d.value)}
              stroke="rgba(11,18,32,0.10)"
              strokeWidth="0.5"
              onMouseMove={(event) => {
                const rect = rootRef.current?.getBoundingClientRect();
                if (!rect) {
                  return;
                }
                setHovered({
                  date: d.date,
                  value: d.value,
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                });
              }}
            />
          );
        })}
      </svg>

      {hovered ? (
        <div
          className="pointer-events-none absolute rounded-2xl border border-[color:var(--kw-border-2)] bg-white/85 px-3 py-2 text-xs shadow-[var(--kw-shadow-soft)] backdrop-blur"
          style={{
            left: hovered.x + 10,
            top: hovered.y + 10,
          }}
        >
          <p className="font-semibold text-[color:var(--kw-ink)]">{hovered.value} activity</p>
          <p className="text-[color:var(--kw-muted)]">{formatDate(hovered.date)}</p>
        </div>
      ) : null}
    </div>
  );
}
