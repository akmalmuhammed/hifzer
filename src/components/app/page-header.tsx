import type { ReactNode } from "react";
import clsx from "clsx";

export function PageHeader(props: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between", props.className)}>
      <div className="min-w-0">
        {props.eyebrow ? (
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            {props.eyebrow}
          </div>
        ) : null}
        <h1 className="mt-2 truncate font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
          {props.title}
        </h1>
        {props.subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
            {props.subtitle}
          </p>
        ) : null}
      </div>
      {props.right ? <div className="w-full min-w-0 sm:w-auto sm:max-w-full">{props.right}</div> : null}
    </div>
  );
}
