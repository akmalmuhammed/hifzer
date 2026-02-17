"use client";

import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

function variantClasses(variant: ButtonVariant): string {
  if (variant === "secondary") {
    return "border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-surface-strong)]";
  }
  if (variant === "ghost") {
    return "border border-transparent bg-transparent text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-soft)]";
  }
  if (variant === "danger") {
    return "border border-transparent bg-rose-600 text-white hover:bg-rose-700";
  }
  return "border border-transparent bg-[rgba(var(--kw-accent-rgb),1)] text-white hover:bg-[rgba(var(--kw-accent-rgb),0.86)]";
}

function sizeClasses(size: ButtonSize): string {
  if (size === "sm") {
    return "h-9 rounded-xl px-3 text-sm";
  }
  if (size === "lg") {
    return "h-12 rounded-2xl px-5 text-base";
  }
  return "h-10 rounded-2xl px-4 text-sm";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition",
        "shadow-[var(--kw-shadow-soft)] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--kw-bg)]",
        variantClasses(variant),
        sizeClasses(size),
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span className="text-sm opacity-90">Working</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});
