import { useId, type SVGProps } from "react";
import clsx from "clsx";

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

export function Sparkline({
  values,
  tone = "brand",
  className,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "values"> & { values: readonly number[]; tone?: Tone }) {
  const width = 120;
  const height = 28;
  const padding = 2;
  const safe = values.length ? values : [0];

  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const span = max - min || 1;

  const points = safe
    .map((v, i) => {
      const x = padding + (i * (width - padding * 2)) / Math.max(1, safe.length - 1);
      const y = padding + ((max - v) * (height - padding * 2)) / span;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const color = toneColor(tone);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = `kw_sp_${tone}_${uid}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={clsx("block h-7 w-full", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      <path
        d={`M ${points} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
        fill={`url(#${id})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
