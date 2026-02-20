import { BookOpenText, Headphones, Search } from "lucide-react";
import { CardSoft } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const BLOCKS = [
  {
    title: "Hifz plan that protects retention",
    copy:
      "Hifzer gives you a clear daily order: review first, then new ayahs only when recall is strong. This protects what you already memorized.",
    icon: <BookOpenText size={18} />,
    pill: "Hifz",
  },
  {
    title: "Qur'an recitation with progress",
    copy:
      "Read and recite directly inside the app with tracked position and completion progress so you can continue exactly where you stopped.",
    icon: <Headphones size={18} />,
    pill: "Recitation",
  },
  {
    title: "Built-in Qur'anic glossary",
    copy:
      "Search key Qur'anic terms quickly while reading, so understanding and memorization improve together in one flow.",
    icon: <Search size={18} />,
    pill: "Glossary",
  },
] as const;

export function WhatHifzerDoes() {
  return (
    <section className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            What it does
          </p>
          <h2 className="mt-3 max-w-3xl text-balance font-[family-name:var(--font-kw-display)] text-3xl leading-tight tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
            One system for Hifz practice, Qur&apos;an recitation, and glossary support.
          </h2>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {BLOCKS.map((block) => (
          <CardSoft key={block.title} className="h-full">
            <div className="flex items-start justify-between gap-4">
              <Pill tone="neutral">{block.pill}</Pill>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                {block.icon}
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">{block.title}</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{block.copy}</p>
          </CardSoft>
        ))}
      </div>
    </section>
  );
}
