"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock3, LifeBuoy, ShieldCheck } from "lucide-react";

const LAYERS = [
  {
    title: "Your place is still there",
    subtitle: "Return without reorienting yourself",
    copy:
      "Hifzer keeps your ayah, surah, bookmarks, and audio together so coming back feels immediate.",
    bullets: [
      "Resume from the exact ayah",
      "Bookmarks and notes stay nearby",
      "Audio is ready when you need it",
    ],
    icon: ShieldCheck,
    surfaceClassName:
      "border-[rgba(10,138,119,0.18)] bg-[radial-gradient(circle_at_top_left,rgba(10,138,119,0.16),transparent_38%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
    iconClassName:
      "border-[rgba(10,138,119,0.2)] bg-[rgba(10,138,119,0.1)] text-[rgba(10,138,119,0.95)]",
  },
  {
    title: "Review does not disappear in the background",
    subtitle: "See what needs attention before it drifts",
    copy:
      "Review stays visible inside the same flow, so you do not need a separate system just to remember what is getting weak.",
    bullets: [
      "Daily review stays visible",
      "Weak areas come forward sooner",
      "Works for revising or memorising",
    ],
    icon: Clock3,
    surfaceClassName:
      "border-[rgba(var(--kw-accent-rgb),0.18)] bg-[radial-gradient(circle_at_top_right,rgba(var(--kw-accent-rgb),0.16),transparent_40%),linear-gradient(180deg,var(--kw-surface),var(--kw-surface-soft))]",
    iconClassName:
      "border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]",
  },
  {
    title: "The private side stays private",
    subtitle: "Keep duas and notes close to the text",
    copy:
      "Write reflections, keep guided duas close, and save meaningful moments without turning practice into a feed.",
    bullets: [
      "Private journal",
      "Guided duas",
      "Moments and notes stay yours",
    ],
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

        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--kw-faint)]">
            Why it helps
          </p>
          <h2 className="kw-marketing-display mt-3 max-w-3xl text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
            Useful on the days you return tired, distracted, or already behind.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)] md:text-[15px]">
            Most routines break for ordinary reasons: your place disappears, your review gets
            fuzzy, or your notes and duas live somewhere else. Hifzer reduces that friction.
          </p>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-3">
          {LAYERS.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <motion.div
                key={layer.title}
                initial={false}
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
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
