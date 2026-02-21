import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { CardSoft } from "@/components/ui/card";

const STEPS = [
  {
    step: "01",
    title: "Warm-up and verify recall",
    copy: "Start with what you already memorized so stability comes first.",
    icon: <CheckCircle2 size={18} />,
  },
  {
    step: "02",
    title: "Review due ayahs and weak links",
    copy: "Hifzer prioritizes what is fading so debt does not build silently.",
    icon: <Clock3 size={18} />,
  },
  {
    step: "03",
    title: "Unlock a small new chunk",
    copy: "New memorization opens only after review quality is in a safe range.",
    icon: <ArrowRight size={18} />,
  },
] as const;

export function WhatHifzerDoes() {
  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-[860px] text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
          How Hifzer works
        </p>
        <h2 className="kw-marketing-display kw-gradient-headline mt-3 text-balance text-3xl leading-tight sm:text-4xl">
          Three steps. One daily rhythm.
        </h2>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((item) => (
          <CardSoft key={item.title} className="h-full">
            <div className="flex items-center justify-between gap-3">
              <p className="font-[family-name:var(--font-kw-display)] text-2xl font-semibold tracking-tight text-[rgba(var(--kw-accent-rgb),1)]">
                {item.step}
              </p>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 text-[color:var(--kw-ink-2)]">
                {item.icon}
              </span>
            </div>
            <p className="mt-4 text-lg font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
              {item.title}
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{item.copy}</p>
          </CardSoft>
        ))}
      </div>
    </section>
  );
}
