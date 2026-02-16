import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "kw-glass-strong rounded-[var(--kw-radius-xl)]",
        "px-4 py-4 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardSoft({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "kw-glass rounded-[var(--kw-radius-xl)]",
        "px-4 py-4 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("flex items-start justify-between gap-4", className)} {...props} />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx("text-sm font-semibold text-[color:var(--kw-ink)]", className)} {...props} />
  );
}

export function CardKpi({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("mt-2 flex items-baseline justify-between gap-4", className)} {...props} />
  );
}

