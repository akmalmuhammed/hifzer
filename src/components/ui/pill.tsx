import type { HTMLAttributes } from "react";
import clsx from "clsx";

type PillTone = "neutral" | "brand" | "accent" | "warn" | "success" | "danger";

function toneClasses(tone: PillTone) {
  if (tone === "brand") {
    return "border-[color:var(--kw-pill-brand-border)] bg-[color:var(--kw-pill-brand-bg)] text-[color:var(--kw-pill-brand-fg)]";
  }
  if (tone === "accent") {
    return "border-[color:var(--kw-pill-accent-border)] bg-[color:var(--kw-pill-accent-bg)] text-[color:var(--kw-pill-accent-fg)]";
  }
  if (tone === "warn") {
    return "border-[color:var(--kw-pill-warn-border)] bg-[color:var(--kw-pill-warn-bg)] text-[color:var(--kw-pill-warn-fg)]";
  }
  if (tone === "success") {
    return "border-[color:var(--kw-pill-success-border)] bg-[color:var(--kw-pill-success-bg)] text-[color:var(--kw-pill-success-fg)]";
  }
  if (tone === "danger") {
    return "border-[color:var(--kw-pill-danger-border)] bg-[color:var(--kw-pill-danger-bg)] text-[color:var(--kw-pill-danger-fg)]";
  }
  return "border-[color:var(--kw-pill-neutral-border)] bg-[color:var(--kw-pill-neutral-bg)] text-[color:var(--kw-pill-neutral-fg)]";
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
