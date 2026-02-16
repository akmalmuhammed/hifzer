import type { ISODate } from "@/demo/types";

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return function next() {
    // Deterministic PRNG for demo data.
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toIsoDay(d: Date): ISODate {
  const year = d.getUTCFullYear();
  const month = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${d.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

export function activityDays(params: {
  seed: string;
  days: number;
  includeWeekends: boolean;
}): Array<{ date: ISODate; value: number }> {
  const daysCount = Math.max(1, Math.min(140, Math.floor(params.days)));
  const rng = mulberry32(hash(params.seed));
  const now = new Date();

  const result: Array<{ date: ISODate; value: number }> = [];
  for (let i = daysCount - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.getUTCDay(); // 0 Sun .. 6 Sat
    const weekend = day === 0 || day === 6;

    const baseline = weekend ? 0.35 : 0.8;
    const noise = rng();
    const pulse = (Math.sin((i / 6) * Math.PI) + 1) * 0.25;
    let v = (baseline + pulse) * (0.65 + noise * 0.7);

    if (weekend && !params.includeWeekends) {
      v = 0;
    }

    result.push({ date: toIsoDay(d), value: Math.max(0, Math.round(v * 6)) });
  }
  return result;
}

