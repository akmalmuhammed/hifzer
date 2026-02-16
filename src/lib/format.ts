export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

export function formatPercent01(value01: number, digits = 0): string {
  const v = clamp01(value01) * 100;
  return `${v.toFixed(digits)}%`;
}

export function formatMetric(value: number, unit: "percent" | "count" | "score"): string {
  if (!Number.isFinite(value)) {
    return unit === "percent" ? "0%" : "0";
  }
  if (unit === "percent") {
    return `${value.toFixed(value < 10 ? 1 : 0)}%`;
  }
  if (unit === "score") {
    return value.toFixed(value < 10 ? 1 : 0);
  }
  return Math.round(value).toString();
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
