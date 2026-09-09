"use client";

import { ArrowRight, BookOpenText, PlayCircle } from "lucide-react";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { Pill } from "@/components/ui/pill";
import type { NextAction } from "@/hifzer/continuity/next-action";

export function NextActionCard(props: {
  action: NextAction;
  className?: string;
  secondary?: React.ReactNode;
}) {
  const Icon = props.action.kind === "continue_quran" || props.action.kind === "begin_quran"
    ? BookOpenText
    : PlayCircle;

  return (
    <section
      className={`kw-panel-gradient-strong relative overflow-hidden rounded-[28px] border border-[rgba(var(--kw-accent-rgb),0.2)] p-5 shadow-[var(--kw-shadow-soft)] sm:p-6 ${props.className ?? ""}`}
      aria-labelledby="next-action-title"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[rgba(var(--kw-accent-rgb),0.09)] blur-2xl" />
      <div className="relative flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <Pill tone="accent">{props.action.eyebrow}</Pill>
          <h2 id="next-action-title" className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)]">
            {props.action.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
            {props.action.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <TrackedLink
              href={props.action.href}
              telemetryName="next_action.started"
              telemetryMeta={{
                schema_version: props.action.schemaVersion,
                action_kind: props.action.kind,
                reason_code: props.action.reason,
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.32)] bg-[rgba(var(--kw-accent-rgb),0.14)] px-4 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] transition hover:bg-[rgba(var(--kw-accent-rgb),0.2)]"
            >
              {props.action.actionLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </TrackedLink>
            {props.secondary}
          </div>
          <p className="mt-3 text-xs text-[color:var(--kw-faint)]">
            Why this: {props.action.reason.replaceAll("_", " ")}.
          </p>
        </div>
      </div>
    </section>
  );
}
