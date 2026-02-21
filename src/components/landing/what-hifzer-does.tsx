import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { CardSoft } from "@/components/ui/card";

const STEPS = [
  {
    step: "01",
    title: "Start by guarding what you already know",
    copy: "Review first, so your memorization stays rooted before adding new.",
    icon: <CheckCircle2 size={18} />,
  },
  {
    step: "02",
    title: "Repair weak links before they drift",
    copy: "Prioritize fading ayahs and transitions so gaps do not silently grow.",
    icon: <Clock3 size={18} />,
  },
  {
    step: "03",
    title: "Advance with small, consistent wins",
    copy: "New memorization unlocks after quality review so your growth remains stable.",
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
          The most beloved deeds are the most constant.
        </h2>
        <p className="mx-auto mt-3 max-w-[56ch] text-sm leading-7 text-[color:var(--kw-muted)]">
          Consistency beats intensity in daily Hifz.
          <span className="ml-2 inline-flex items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-0.5 align-middle text-[10px] font-semibold leading-none tracking-[0.08em] text-[color:var(--kw-faint)]">
            Sahih al-Bukhari 6464
          </span>
        </p>
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
