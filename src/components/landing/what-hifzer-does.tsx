import { BookOpen, CheckCircle2, Flame } from "lucide-react";
import { CardSoft } from "@/components/ui/card";

const STEPS = [
  {
    step: "01",
    title: "Keep it daily, even if small",
    copy: "Small daily recitation builds a lifelong bond with the Qur'an. Consistency outlasts intensity every time.",
    source: "Sahih al-Bukhari 6464",
    icon: <CheckCircle2 size={18} />,
  },
  {
    step: "02",
    title: "Learn and teach what you recite",
    copy: "What you understand deeply and share sincerely stays with you longer than what you rush through alone.",
    source: "Sahih al-Bukhari 5027",
    icon: <BookOpen size={18} />,
  },
  {
    step: "03",
    title: "Do not stop when it feels hard",
    copy: "Difficulty in recitation is not failure — it is double reward. The struggle is part of the path.",
    source: "Sahih Muslim 798a",
    icon: <Flame size={18} />,
  },
] as const;

export function WhatHifzerDoes() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-[860px] text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
          Authentic guidance
        </p>
        <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
          Practice rooted in{" "}
          <span className="text-[rgba(var(--kw-accent-rgb),1)]">tradition.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-7 text-[color:var(--kw-muted)]">
          The most beloved deeds to Allah are those done consistently, even if small. Hifzer
          encodes this principle into every session.
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
            <p className="mt-3">
              <span className="inline-flex items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-0.5 text-[11px] font-semibold leading-none tracking-[0.07em] text-[color:var(--kw-faint)]">
                {item.source}
              </span>
            </p>
          </CardSoft>
        ))}
      </div>
    </section>
  );
}
