"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "h-11 w-full rounded-2xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 text-sm",
          "text-[color:var(--kw-ink)] placeholder:text-[color:var(--kw-faint)]",
          "shadow-[var(--kw-shadow-soft)] backdrop-blur transition",
          "focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus:bg-[color:var(--kw-surface-strong)] focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(
          "min-h-[120px] w-full resize-none rounded-2xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 py-2 text-sm",
          "text-[color:var(--kw-ink)] placeholder:text-[color:var(--kw-faint)]",
          "shadow-[var(--kw-shadow-soft)] backdrop-blur transition",
          "focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus:bg-[color:var(--kw-surface-strong)] focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);
