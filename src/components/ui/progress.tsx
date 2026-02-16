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

export function ProgressBar(props: {
  value: number; // 0..1
  tone?: Tone;
  className?: string;
  height?: number;
  ariaLabel?: string;
}) {
  const v = Math.max(0, Math.min(1, props.value));
  const h = props.height ?? 10;
  const color = toneColor(props.tone ?? "brand");

  return (
    <div
      className={clsx(
        "w-full overflow-hidden rounded-full border border-[color:var(--kw-border-2)] bg-black/[0.05]",
        props.className,
      )}
      style={{ height: h }}
      role="img"
      aria-label={props.ariaLabel ?? `Progress ${Math.round(v * 100)}%`}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${(v * 100).toFixed(1)}%`,
          background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.18))`,
        }}
      />
    </div>
  );
}

