"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock3, LifeBuoy, ShieldCheck } from "lucide-react";
import { Pill } from "@/components/ui/pill";

const SIGNALS = [
  {
    label: "Before every session",
    value: "Warm-up checks yesterday first",
  },
  {
    label: "When retention drops",
    value: "The plan switches into consolidation",
  },
  {
    label: "When recall bends",
    value: "Link repair and rescue drills step in",
  },
] as const;

const LAYERS = [
  {
    title: "Daily protection loop",
    subtitle: "Warm-up, Sabqi, and Manzil stay in one honest flow",
    copy:
      "New memorisation does not open just because you showed up. Hifzer checks yesterday's Sabaq first, keeps recent review and long-term review in the same rhythm, and makes you earn today's new lesson with clean recall.",
    bullets: [
      "Warm-up can block new when yesterday is shaky",
      "Blind recall exposes gaps before they spread",
      "Recent and long-term review stay attached to the same session",
    ],
    footer: "Runs before every Hifz session",
    pill: { label: "Daily gate", tone: "brand" as const },
    icon: ShieldCheck,
    surfaceClassName:
      "border-[rgba(10,138,119,0.18)] bg-[radial-gradient(circle_at_top_left,rgba(10,138,119,0.16),transparent_38%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
    iconClassName:
      "border-[rgba(10,138,119,0.2)] bg-[rgba(10,138,119,0.1)] text-[rgba(10,138,119,0.95)]",
  },
  {
    title: "Weekly consolidation boundary",
    subtitle: "Catch silent forgetting before it becomes a collapse",
    copy:
      "Once a week Hifzer samples older material and checks whether retention still holds. If the weekly gate fails, the app does not pretend everything is fine. It shifts the day into consolidation so you stabilise before moving again.",
    bullets: [
      "Mandatory weekly retention check",
      "Automatic switch to review-focused mode",
      "Hidden decay is surfaced early instead of months later",
    ],
    footer: "Runs automatically each week",
    pill: { label: "Weekly gate", tone: "accent" as const },
    icon: Clock3,
    surfaceClassName:
      "border-[rgba(var(--kw-accent-rgb),0.18)] bg-[radial-gradient(circle_at_top_right,rgba(var(--kw-accent-rgb),0.16),transparent_40%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
    iconClassName:
      "border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]",
  },
  {
    title: "Repair layer for real mistakes",
    subtitle: "Weak seams, similar ayahs, and backlog pressure get their own tools",
    copy:
      "When recall starts bending, Hifzer does more than show a lower score. It shifts load when reviews pile up, sends weak transitions into link repair, and gives you rescue and mushabihat practice without quietly mutating your main Hifz queue.",
    bullets: [
      "Review pressure reduces new load automatically",
      "Link repair isolates weak transitions",
      "Rescue sessions and mushabihat radar target the fragile parts directly",
    ],
    footer: "Appears when the system detects fragility",
    pill: { label: "Repair tools", tone: "warn" as const },
    icon: LifeBuoy,
    surfaceClassName:
      "border-[rgba(234,88,12,0.18)] bg-[radial-gradient(circle_at_bottom_right,rgba(234,88,12,0.14),transparent_38%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
    iconClassName:
      "border-[rgba(234,88,12,0.2)] bg-[rgba(234,88,12,0.08)] text-[rgba(234,88,12,0.92)]",
  },
] as const;

export function QualityGates() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 md:py-14">
      <div className="relative overflow-hidden rounded-[34px] border border-[rgba(var(--kw-accent-rgb),0.14)] bg-[radial-gradient(circle_at_top_left,rgba(10,138,119,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(var(--kw-accent-rgb),0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(234,88,12,0.08),transparent_26%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))] px-5 py-6 shadow-[var(--kw-shadow)] backdrop-blur-xl md:px-8 md:py-8">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--kw-accent-rgb),0.5),transparent)]" />
          <div className="absolute inset-y-0 left-0 w-px bg-[linear-gradient(180deg,transparent,rgba(10,138,119,0.28),transparent)]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--kw-faint)]">
              Retention engine
            </p>
            <h2 className="kw-marketing-display mt-3 max-w-3xl text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
              Progress only counts
              <span className="block text-[rgba(var(--kw-accent-rgb),1)]">if recall still holds.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)] md:text-[15px]">
              Hifzer does not just count ayahs covered. It checks yesterday&apos;s Sabaq, samples older
              material, slows new memorisation when retention drops, and gives you repair tools for weak
              seams, similar ayahs, and review overload before damage becomes normal.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill tone="brand">Warm-up before new</Pill>
              <Pill tone="accent">Weekly consolidation gate</Pill>
              <Pill tone="warn">Link repair + rescue work</Pill>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {SIGNALS.map((signal) => (
              <div
                key={signal.label}
                className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-[radial-gradient(circle_at_top_left,rgba(var(--kw-accent-rgb),0.08),transparent_34%),linear-gradient(180deg,var(--kw-surface-soft),var(--kw-surface))] px-4 py-4 shadow-[var(--kw-shadow-soft)]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--kw-faint)]">
                  {signal.label}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--kw-ink)]">
                  {signal.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 lg:grid-cols-[1.08fr_0.96fr_0.96fr]">
          {LAYERS.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <motion.div
                key={layer.title}
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: reduceMotion ? 0 : 0.45, delay: idx * 0.05 }}
                className="h-full"
              >
                <div
                  className={[
                    "flex h-full flex-col overflow-hidden rounded-[28px] border px-5 py-5 shadow-[var(--kw-shadow-soft)] backdrop-blur-xl",
                    layer.surfaceClassName,
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={[
                        "grid h-11 w-11 place-items-center rounded-2xl border shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
                        layer.iconClassName,
                      ].join(" ")}
                    >
                      <Icon size={18} />
                    </div>
                    <Pill tone={layer.pill.tone}>{layer.pill.label}</Pill>
                  </div>

                  <p className="mt-5 text-xl font-bold tracking-tight text-[color:var(--kw-ink)]">
                    {layer.title}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[rgba(var(--kw-accent-rgb),1)]">
                    {layer.subtitle}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">{layer.copy}</p>

                  <div className="mt-5 grid gap-2">
                    {layer.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="flex items-start gap-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-[linear-gradient(180deg,var(--kw-surface-soft),var(--kw-surface))] px-3 py-3"
                      >
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[rgba(var(--kw-accent-rgb),0.9)]" />
                        <p className="text-sm leading-6 text-[color:var(--kw-ink-2)]">{bullet}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[18px] border border-[color:var(--kw-border-2)] bg-[linear-gradient(180deg,var(--kw-surface-soft),var(--kw-surface))] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--kw-faint)]">
                      System behavior
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--kw-ink)]">
                      {layer.footer}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
