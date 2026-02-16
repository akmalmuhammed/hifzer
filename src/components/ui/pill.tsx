import type { HTMLAttributes } from "react";
import clsx from "clsx";

type PillTone = "neutral" | "brand" | "accent" | "warn" | "success" | "danger";

function toneClasses(tone: PillTone) {
  if (tone === "brand") {
    return "border-[rgba(10,138,119,0.25)] bg-[rgba(10,138,119,0.12)] text-[color:var(--kw-teal-800)]";
  }
  if (tone === "accent") {
    return "border-[rgba(43,75,255,0.25)] bg-[rgba(43,75,255,0.12)] text-[rgba(31,54,217,1)]";
  }
  if (tone === "warn") {
    return "border-[rgba(234,88,12,0.28)] bg-[rgba(234,88,12,0.12)] text-[color:var(--kw-ember-600)]";
  }
  if (tone === "success") {
    return "border-[rgba(22,163,74,0.28)] bg-[rgba(22,163,74,0.12)] text-[color:var(--kw-lime-600)]";
  }
  if (tone === "danger") {
    return "border-[rgba(225,29,72,0.26)] bg-[rgba(225,29,72,0.12)] text-[color:var(--kw-rose-600)]";
  }
  return "border-[color:var(--kw-border-2)] bg-white/60 text-[color:var(--kw-ink-2)]";
}

export function Pill({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: PillTone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight",
        toneClasses(tone),
        className,
      )}
      {...props}
    />
  );
}
