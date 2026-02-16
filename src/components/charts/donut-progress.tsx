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

export function DonutProgress(props: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  tone?: Tone;
  className?: string;
}) {
  const value = Math.max(0, Math.min(1, props.value));
  const size = props.size ?? 44;
  const stroke = props.stroke ?? 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * value;
  const color = toneColor(props.tone ?? "brand");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={clsx("block", props.className)}
      aria-label={`Progress ${Math.round(value * 100)}%`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(11,18,32,0.10)"
        strokeWidth={stroke}
        fill="transparent"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

