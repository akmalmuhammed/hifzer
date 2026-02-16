import type { SVGProps } from "react";
import clsx from "clsx";

export function WindLines({
  className,
  ...props
}: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("h-full w-full", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="kw_wind" x1="0" y1="0" x2="1200" y2="600" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(10,138,119,0.40)" />
          <stop offset="0.52" stopColor="rgba(43,75,255,0.26)" />
          <stop offset="1" stopColor="rgba(234,88,12,0.20)" />
        </linearGradient>
      </defs>

      {[
        "M-40 140 C 220 70, 420 240, 680 180 S 1120 80, 1280 170",
        "M-40 210 C 260 140, 430 320, 720 240 S 1110 140, 1280 250",
        "M-40 290 C 260 220, 460 410, 760 320 S 1110 210, 1280 330",
        "M-40 370 C 230 300, 480 520, 780 400 S 1100 320, 1280 430",
        "M-40 450 C 250 390, 510 600, 820 480 S 1080 410, 1280 520",
      ].map((d, idx) => (
        <path
          key={d}
          d={d}
          stroke="url(#kw_wind)"
          strokeWidth={idx === 0 ? 2.4 : 2}
          strokeLinecap="round"
          opacity={idx === 0 ? 0.85 : 0.55}
        />
      ))}

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

