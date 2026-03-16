import { BookOpenText, Bookmark, HandHeart, ShieldCheck } from "lucide-react";
import { CardSoft } from "@/components/ui/card";

const LANES = [
  {
    label: "Hifz",
    title: "Memorize with a plan that stays honest",
    copy:
      "Review what is due first, add new portions only when they are ready, and recover gently after missed days.",
    note: "Built for steadiness, not heroics.",
    icon: <Bookmark size={18} />,
  },
  {
    label: "Qur'an",
    title: "Read without losing your place",
    copy:
      "Continue from the ayah you last touched, keep reader preferences ready, and move through the mushaf without friction.",
    note: "Reading progress stays separate from Hifz.",
    icon: <BookOpenText size={18} />,
  },
  {
    label: "Dua",
    title: "Open guided worship without noise",
    copy:
      "Move through sourced dua modules, keep private personal duas separate, and let the page stay centered on worship.",
    note: "Repentance, Laylat al-Qadr, and Allah's Beautiful Names are already built in.",
    icon: <HandHeart size={18} />,
  },
] as const;

export function WhatHifzerDoes() {
  return (
    <section id="lanes" className="py-10 md:py-14">
      <div className="mx-auto max-w-[860px] text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
          What Hifzer holds together
        </p>
        <h2 className="kw-marketing-display kw-gradient-headline mt-3 text-balance text-3xl leading-tight sm:text-4xl">
          One calm home. Three clear lanes.
        </h2>
        <p className="mx-auto mt-3 max-w-[56ch] text-sm leading-7 text-[color:var(--kw-muted)]">
          Hifzer treats memorization, daily reading, and dua like different acts of worship instead
          of pushing everything into one noisy feed.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {LANES.map((item) => (
          <CardSoft key={item.title} className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(var(--kw-accent-rgb),1)]">
                {item.label}
              </p>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 text-[color:var(--kw-ink-2)]">
                {item.icon}
              </span>
            </div>
            <p className="mt-4 text-lg font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
              {item.title}
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{item.copy}</p>
            <div className="mt-4 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/72 px-3 py-3 text-sm leading-6 text-[color:var(--kw-ink-2)]">
              {item.note}
            </div>
          </CardSoft>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/72 px-5 py-4 shadow-[var(--kw-shadow-soft)] backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.16)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-[rgba(var(--kw-accent-rgb),1)]">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">That separation is the point.</p>
            <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">
              Reading progress does not overwrite Hifz progress, and private duas do not get mixed
              into public-feeling productivity streaks. The app stays cleaner because each lane keeps
              its own purpose.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
