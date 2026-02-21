import type { SVGProps } from "react";
import clsx from "clsx";

const PATHS = [
  "M-40 140 C 220 70, 420 240, 680 180 S 1120 80, 1280 170",
  "M-40 210 C 260 140, 430 320, 720 240 S 1110 140, 1280 250",
  "M-40 290 C 260 220, 460 410, 760 320 S 1110 210, 1280 330",
  "M-40 370 C 230 300, 480 520, 780 400 S 1100 320, 1280 430",
  "M-40 450 C 250 390, 510 600, 820 480 S 1080 410, 1280 520",
];

export function WindLines({
  className,
  animated = false,
  ...props
}: SVGProps<SVGSVGElement> & { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 1200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("h-full w-full", animated && "kw-wind-animated", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="kw_wind" x1="0" y1="0" x2="1200" y2="600" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(10,138,119,0.72)" />
          <stop offset="0.52" stopColor="rgba(43,75,255,0.52)" />
          <stop offset="1" stopColor="rgba(234,88,12,0.42)" />
        </linearGradient>

        {/* Glow filter: light mode — layered soft glow */}
        <filter id="kw_wind_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="wideBlur" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="tightBlur" />
          <feMerge>
            <feMergeNode in="wideBlur" />
            <feMergeNode in="tightBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glow filter: dark mode — vivid neon triple-layer */}
        <filter id="kw_wind_glow_dark" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5.5" result="outerBlur" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="midBlur" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="innerBlur" />
          <feMerge>
            <feMergeNode in="outerBlur" />
            <feMergeNode in="midBlur" />
            <feMergeNode in="innerBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="kw-wind-paths">
        {PATHS.map((d, idx) => (
          <path
            key={d}
            d={d}
            stroke="url(#kw_wind)"
            strokeWidth={idx === 0 ? 2.25 : 1.75}
            strokeLinecap="round"
            opacity={idx === 0 ? 0.66 : 0.5}
            strokeDasharray={animated ? "1200" : undefined}
            style={
              animated
                ? {
                    animation: `kw-wind-flow ${18 + idx * 3}s linear infinite, kw-wind-pulse ${8 + idx * 2}s ease-in-out infinite`,
                    animationDelay: `${idx * 0.8}s`,
                  }
                : undefined
            }
          />
        ))}
      </g>

      <path
        d="M-40 515 C 280 440, 540 640, 860 520 S 1090 470, 1280 560"
        stroke="rgba(11,18,32,0.10)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
