function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function isoDateLocal(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function isoDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isoDateToUtcMidnightMs(isoDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
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

export function addIsoDaysUtc(isoDate: string, deltaDays: number): string {
  const base = isoDateToUtcMidnightMs(isoDate);
  if (!base) {
    return isoDate;
  }
  const next = new Date(base + deltaDays * 24 * 60 * 60 * 1000);
  return isoDateUtc(next);
}
