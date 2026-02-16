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
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Workload = {
  build: number;
  ship: number;
  support: number;
  total: number;
  focus: "Build" | "Ship" | "Support";
};

export function memberWorkload(seed: string): Workload {
  const rng = mulberry32(hash(seed));

  const raw = [0.6 + rng(), 0.6 + rng(), 0.6 + rng()];
  const totalRaw = raw.reduce((a, b) => a + b, 0) || 1;
  const pct = raw.map((v) => Math.round((v / totalRaw) * 100));

  // Fix rounding to sum to 100.
  const sum = pct.reduce((a, b) => a + b, 0);
  pct[0] += 100 - sum;

  const build = Math.max(0, pct[0] ?? 0);
  const ship = Math.max(0, pct[1] ?? 0);
  const support = Math.max(0, pct[2] ?? 0);
  const max = Math.max(build, ship, support);
  const focus = max === support ? "Support" : max === ship ? "Ship" : "Build";

  return { build, ship, support, total: 100, focus };
}

