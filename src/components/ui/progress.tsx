import clsx from "clsx";

type Tone = "brand" | "accent" | "warn" | "neutral";

function toneColor(tone: Tone): string {
  if (tone === "accent") {
    return "rgba(var(--kw-accent-rgb), 1)";
  }
  if (tone === "warn") {
    return "var(--kw-chart-3)";
  }
  if (tone === "neutral") {
    return "var(--kw-muted)";
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
        "w-full overflow-hidden rounded-full bg-[color:var(--kw-track)]",
        props.className,
      )}
      style={{ height: h }}
      role="progressbar"
      aria-label={props.ariaLabel ?? "Progress"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-[var(--kw-ease)]"
        style={{
          width: `${(v * 100).toFixed(1)}%`,
          background: color,
        }}
      />
    </div>
  );
}
