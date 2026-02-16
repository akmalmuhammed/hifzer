import type { SVGProps } from "react";

export function HifzerMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4.5 19.6C8.3 12 13.4 9.2 23.5 10.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4.5 22.8C8.2 16.9 13.8 14.5 23.5 15.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.78"
      />
      <path
        d="M4.5 16.3C9.5 9 15.6 7.3 23.5 7.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.58"
      />
      <circle cx="20.6" cy="5.8" r="1.55" fill="currentColor" opacity="0.96" />
    </svg>
  );
}

