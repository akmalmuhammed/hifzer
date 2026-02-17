export function isoDateInTimeZone(now: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

function isoToUtcMidnight(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }
  return Date.UTC(y, mo - 1, d);
}

export function missedDaysSince(lastCompletedLocalDate: string | null, todayLocalDate: string): number {
  const nowMs = isoToUtcMidnight(todayLocalDate);
  const lastMs = lastCompletedLocalDate ? isoToUtcMidnight(lastCompletedLocalDate) : null;
  if (!nowMs || !lastMs) {
    return 0;
  }
  const diffDays = Math.floor((nowMs - lastMs) / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays - 1);
}

