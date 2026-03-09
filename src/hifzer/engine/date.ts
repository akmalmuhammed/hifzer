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

export function missedScheduledDaysSince(
  lastCompletedLocalDate: string | null,
  todayLocalDate: string,
  practiceDays: number[],
): number {
  const nowMs = isoToUtcMidnight(todayLocalDate);
  const lastMs = lastCompletedLocalDate ? isoToUtcMidnight(lastCompletedLocalDate) : null;
  if (!nowMs || !lastMs) {
    return 0;
  }

  const scheduledDays = new Set(
    practiceDays
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6),
  );
  if (scheduledDays.size < 1) {
    return missedDaysSince(lastCompletedLocalDate, todayLocalDate);
  }

  let missed = 0;
  for (let dayMs = lastMs + (24 * 60 * 60 * 1000); dayMs < nowMs; dayMs += (24 * 60 * 60 * 1000)) {
    const weekday = new Date(dayMs).getUTCDay();
    if (scheduledDays.has(weekday)) {
      missed += 1;
    }
  }
  return missed;
}
