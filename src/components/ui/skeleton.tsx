import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-[14px] bg-[color:var(--kw-skeleton)] motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
