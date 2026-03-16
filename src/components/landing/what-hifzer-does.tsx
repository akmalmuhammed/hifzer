import { ArrowRightLeft, DoorOpen, HeartHandshake, ShieldCheck } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import styles from "./landing.module.css";

const GAP_COLUMNS = [
  {
    label: "The intention",
    title: "You promised yourself you would start properly.",
    copy:
      "Read Qur'an daily, not only in Ramadan. Learn the duas you need in ordinary life. Understand what you recite in salah instead of only repeating it.",
    note: "The desire was real.",
    icon: HeartHandshake,
    tone: "intention" as const,
    pillTone: "brand" as const,
  },
  {
    label: "The reality",
    title: "But life happened.",
    copy:
      "Days turned to weeks. You lost your place. Apps felt louder than they needed to be. Guilt compounded, then silence followed.",
    note: "The gap widened quietly.",
    icon: ArrowRightLeft,
    tone: "reality" as const,
    pillTone: "accent" as const,
  },
  {
    label: "The truth",
    title: "The Qur'an never left you.",
    copy:
      "It is not judging your absence. It is not counting the days you were gone. It is ready for your return today, at whatever page, with whatever intention you carry.",
    note: "Today still counts.",
    icon: DoorOpen,
    tone: "truth" as const,
    pillTone: "warn" as const,
  },
] as const;

export function WhatHifzerDoes() {
  return (
    <section id="gap" className="py-10 md:py-14">
      <div className={`${styles.sectionShell} ${styles.reflectionShell} px-5 py-6 sm:px-6 sm:py-7`}>
        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              The gap
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.96] tracking-[-0.05em] text-white sm:text-5xl">
              The Gap Between Who You Are and Who You Want to Be
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-8 text-white/70">
              It is not about ability. It is about consistency. And consistency gets easier when
              the return feels gentler than the delay.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill tone="brand">Gentle structure</Pill>
              <Pill tone="accent">No shame-driven noise</Pill>
              <Pill tone="warn">Return-focused</Pill>
            </div>
          </div>

          <div className={styles.reflectionGrid}>
            {GAP_COLUMNS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={styles.reflectionCard} data-tone={item.tone}>
                  <div className="flex items-center justify-between gap-3">
                    <Pill tone={item.pillTone}>{item.label}</Pill>
                    <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-white/10 bg-white/10 text-white/90">
                      <Icon size={18} />
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-semibold leading-7 tracking-tight text-white">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/75">{item.copy}</p>
                  <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 px-3 py-3 text-sm leading-6 text-white/90">
                    {item.note}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${styles.returnBanner} mt-6 px-4 py-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-[rgba(var(--kw-accent-rgb),1)]">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                Hifzer tries to shorten the walk back between intention and action.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Not by shouting at you. Not by pretending guilt is motivation. Just by keeping the
                next step closer than the excuse.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
