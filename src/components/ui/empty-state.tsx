import type { ReactNode } from "react";
import clsx from "clsx";

export function EmptyState(props: {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[var(--kw-radius-lg)] bg-[color:var(--kw-fill)] px-6 py-9 text-center",
        props.className,
      )}
    >
      {props.icon ? (
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-muted)]">
          {props.icon}
        </div>
      ) : null}
      <p className="mt-4 text-[1.06rem] font-semibold tracking-[-0.015em] text-[color:var(--kw-ink)]">{props.title}</p>
      {props.message ? (
        <p className="mx-auto mt-1.5 max-w-[34rem] text-sm leading-[1.5] text-[color:var(--kw-muted)]">{props.message}</p>
      ) : null}
      {props.action ? <div className="mt-5 flex justify-center">{props.action}</div> : null}
    </div>
  );
}
