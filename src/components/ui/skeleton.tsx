import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-2xl bg-black/[0.06]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
        className,
      )}
      {...props}
    />
  );
}

