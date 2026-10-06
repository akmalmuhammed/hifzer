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
      className={`relative rounded-[var(--kw-radius-xl)] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-card)] p-6 shadow-[var(--kw-shadow-soft)] sm:p-8 ${props.className ?? ""}`}
      aria-labelledby="next-action-title"
    >
      <div className="relative flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <Pill tone="accent">{props.action.eyebrow}</Pill>
          <h2 id="next-action-title" className="mt-3 text-balance font-[family-name:var(--font-kw-display)] text-[clamp(1.75rem,3vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--kw-ink)]">
            {props.action.title}
          </h2>
          <p className="mt-3 max-w-2xl text-[1.02rem] leading-[1.5] text-[color:var(--kw-muted)]">
            {props.action.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <TrackedLink
              href={props.action.href}
              telemetryName="next_action.started"
              telemetryMeta={{
                schema_version: props.action.schemaVersion,
                action_kind: props.action.kind,
                reason_code: props.action.reason,
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[rgba(var(--kw-accent-rgb),1)] px-5 py-2 text-[0.94rem] font-medium text-white transition-colors duration-200 hover:bg-[rgba(var(--kw-accent-rgb),0.88)]"
            >
              {props.action.actionLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </TrackedLink>
            {props.secondary}
          </div>
          <p className="mt-4 text-[0.82rem] text-[color:var(--kw-faint)]">
            Why this: {props.action.reason.replaceAll("_", " ")}.
          </p>
        </div>
      </div>
    </section>
  );
}
