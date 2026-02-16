import type { StoredAttempt } from "@/hifzer/local/store";
import { addIsoDaysUtc } from "@/hifzer/derived/dates";

export type DailyActivity = { date: string; value: number };

export function buildActivityDays(attempts: StoredAttempt[], endIsoDateUtc: string, days: number): DailyActivity[] {
  const end = endIsoDateUtc;
  const count = Math.max(1, Math.floor(days));

  const byDate = new Map<string, number>();
  for (const a of attempts) {
    const iso = a.createdAt.slice(0, 10);
    byDate.set(iso, (byDate.get(iso) ?? 0) + 1);
  }

  const out: DailyActivity[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = addIsoDaysUtc(end, -i);
    out.push({ date, value: byDate.get(date) ?? 0 });
  }
  return out;
}

