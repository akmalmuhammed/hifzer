"use client";

import type { CSSProperties } from "react";

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

type ShootingStarStyle = CSSProperties & {
  "--kw-shoot-angle": string;
  "--kw-shoot-dx": string;
  "--kw-shoot-dy": string;
};

function generateShootingStars(count: number, seed: number): ShootingStarStyle[] {
  const rng = seededRandom(seed);
  const stars: ShootingStarStyle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = -160 + rng() * 320;
    const distance = 240 + rng() * 300;
    const radians = (angle * Math.PI) / 180;
    const dx = Math.cos(radians) * distance;
    const dy = Math.sin(radians) * distance;

    stars.push({
      top: `${Math.round(8 + rng() * 78)}%`,
      left: `${Math.round(8 + rng() * 84)}%`,
      animationDelay: `${(rng() * 24).toFixed(1)}s`,
      animationDuration: `${(24 + rng() * 18).toFixed(1)}s`,
      "--kw-shoot-angle": `${angle.toFixed(1)}deg`,
      "--kw-shoot-dx": `${dx.toFixed(0)}px`,
      "--kw-shoot-dy": `${dy.toFixed(0)}px`,
    });
  }

  return stars;
}

const W = 2400;
const H = 1600;

const LAYER_1 = generateStars(120, 1337, W, H);
const LAYER_2 = generateStars(80, 4242, W, H);
const LAYER_3 = generateStars(40, 7777, W, H);
const SHOOTING_STARS = generateShootingStars(6, 9099);

export function Starfield() {
  return (
    <div
      className="kw-starfield pointer-events-none fixed inset-0"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      {/* Star layers: each is a single element with many box-shadows. */}
      <div className="kw-stars kw-stars-sm" style={{ boxShadow: LAYER_1 }} />
      <div className="kw-stars kw-stars-md" style={{ boxShadow: LAYER_2 }} />
      <div className="kw-stars kw-stars-lg" style={{ boxShadow: LAYER_3 }} />

      {/* Shooting stars: deterministic, slower, and mixed directions. */}
      {SHOOTING_STARS.map((style, index) => (
        <div key={`shooting-star-${index}`} className="kw-shooting-star" style={style} />
      ))}
    </div>
  );
}
