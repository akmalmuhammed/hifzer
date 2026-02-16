import clsx from "clsx";

export type StackSegment = {
  label: string;
  value: number;
  color: string; // CSS color value
};

export function StackedBars(props: {
  segments: StackSegment[];
  height?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const height = props.height ?? 16;
  const safeSegments = props.segments.map((s) => ({ ...s, value: Math.max(0, s.value) }));
  const total = safeSegments.reduce((acc, s) => acc + s.value, 0) || 1;
  const widths = safeSegments.map((s) => (s.value / total) * 100);
  const positions = widths.reduce(
    (acc, w) => ({ xs: [...acc.xs, acc.cursor], cursor: acc.cursor + w }),
    { xs: [] as number[], cursor: 0 },
  ).xs;

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      className={clsx("block w-full", props.className)}
      role="img"
      aria-label={props.ariaLabel ?? "Stacked bar chart"}
    >
      <rect x="0" y="0" width="100" height={height} rx={height / 2} fill="rgba(11,18,32,0.08)" />
      {safeSegments.map((s, idx) => {
        const w = widths[idx] ?? 0;
        const x = positions[idx] ?? 0;
        return (
          <rect
            key={s.label}
            x={x}
            y="0"
            width={w}
            height={height}
            rx={height / 2}
            fill={s.color}
            opacity="0.9"
          />
        );
      })}
    </svg>
  );
}
