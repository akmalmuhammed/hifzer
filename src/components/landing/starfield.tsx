"use client";

/**
 * Deterministic seeded PRNG (linear congruential generator).
 * Avoids Math.random() to prevent SSR/client hydration mismatch.
 */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateStars(count: number, seed: number, w: number, h: number): string {
  const rng = seededRandom(seed);
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(rng() * w);
    const y = Math.round(rng() * h);
    shadows.push(`${x}px ${y}px currentColor`);
  }
  return shadows.join(", ");
}

const W = 2400;
const H = 1600;

const LAYER_1 = generateStars(120, 1337, W, H);
const LAYER_2 = generateStars(80, 4242, W, H);
const LAYER_3 = generateStars(40, 7777, W, H);

export function Starfield() {
  return (
    <div
      className="kw-starfield pointer-events-none fixed inset-0"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      {/* Star layers — each is a single element with many box-shadows */}
      <div className="kw-stars kw-stars-sm" style={{ boxShadow: LAYER_1 }} />
      <div className="kw-stars kw-stars-md" style={{ boxShadow: LAYER_2 }} />
      <div className="kw-stars kw-stars-lg" style={{ boxShadow: LAYER_3 }} />

      {/* Shooting stars — staggered animation delays */}
      <div className="kw-shooting-star" style={{ top: "12%", left: "70%", animationDelay: "0s" }} />
      <div className="kw-shooting-star" style={{ top: "28%", left: "45%", animationDelay: "3.2s" }} />
      <div className="kw-shooting-star" style={{ top: "55%", left: "82%", animationDelay: "6.8s" }} />
      <div className="kw-shooting-star" style={{ top: "38%", left: "20%", animationDelay: "10.1s" }} />
      <div className="kw-shooting-star" style={{ top: "68%", left: "60%", animationDelay: "14.5s" }} />
    </div>
  );
}
