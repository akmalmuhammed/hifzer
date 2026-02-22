import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { CardSoft } from "@/components/ui/card";

const STEPS = [
  {
    step: "01",
    title: "Keep it daily, even if small",
    copy: "Small daily recitation builds a lifelong bond with the Qur&apos;an.",
    source: "Sahih al-Bukhari 6464",
    icon: <CheckCircle2 size={18} />,
  },
  {
    step: "02",
    title: "Learn and teach what you recite",
    copy: "What you learn deeply and share sincerely stays with you longer.",
    source: "Sahih al-Bukhari 5027",
    icon: <Clock3 size={18} />,
  },
  {
    step: "03",
    title: "Do not stop when it feels hard",
    copy: "Difficulty in recitation is not failure; it is reward with perseverance.",
    source: "Sahih Muslim 798a",
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
          A recitation rhythm rooted in authentic guidance.
        </h2>
        <p className="mx-auto mt-3 max-w-[56ch] text-sm leading-7 text-[color:var(--kw-muted)]">
          The most beloved deeds to Allah are those done consistently.
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
            <p className="mt-3">
              <span className="inline-flex items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-0.5 text-[10px] font-semibold leading-none tracking-[0.08em] text-[color:var(--kw-faint)]">
                {item.source}
              </span>
            </p>
          </CardSoft>
        ))}
      </div>
    </section>
  );
}
