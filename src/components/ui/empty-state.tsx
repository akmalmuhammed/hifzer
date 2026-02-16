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
        "rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/55 px-5 py-6 text-center shadow-[var(--kw-shadow-soft)] backdrop-blur",
        props.className,
      )}
    >
      {props.icon ? (
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
          {props.icon}
        </div>
      ) : null}
      <p className="mt-3 text-sm font-semibold text-[color:var(--kw-ink)]">{props.title}</p>
      {props.message ? (
        <p className="mt-1 text-sm text-[color:var(--kw-muted)]">{props.message}</p>
      ) : null}
      {props.action ? <div className="mt-4 flex justify-center">{props.action}</div> : null}
    </div>
  );
}

