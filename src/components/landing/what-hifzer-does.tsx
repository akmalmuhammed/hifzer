import { ArrowRightLeft, DoorOpen, HeartHandshake, ShieldCheck } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import styles from "./landing.module.css";

const REALITY_COLUMNS = [
  {
    label: "The intention",
    title: "You really did mean to be consistent.",
    copy:
      "Read Qur'an daily. Start Hifz properly. Keep the duas you need on your tongue. Understand what you recite instead of only repeating it.",
    note: "The desire was real.",
    icon: HeartHandshake,
    tone: "intention" as const,
    pillTone: "brand" as const,
  },
  {
    label: "The reality",
    title: "Then life got loud.",
    copy:
      "Days turned into weeks. Your place disappeared. Restarting began to feel heavier every time, and the guilt became its own barrier.",
    note: "The gap widened quietly.",
    icon: ArrowRightLeft,
    tone: "reality" as const,
    pillTone: "accent" as const,
  },
  {
    label: "The truth",
    title: "The Qur'an never left you.",
    copy:
      "Allah's door did not close. What you need now is not more shame. You need a gentler return and a clearer place to begin again.",
    note: "Today still counts.",
    icon: DoorOpen,
    tone: "truth" as const,
    pillTone: "warn" as const,
  },
] as const;

export function WhatHifzerDoes() {
  return (
    <section id="return" className="py-10 md:py-14">
      <div className={`${styles.sectionShell} ${styles.reflectionShell} px-5 py-6 sm:px-6 sm:py-7`}>
        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              The spiritual reality
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.96] tracking-[-0.05em] text-white sm:text-5xl">
              The gap between who you are and who you want to be is not ability. It is consistency.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-8 text-white/70">
              Hifzer is built for the Muslim who keeps meaning to come back: the one who wants more
              Qur&apos;an, more presence, more steadiness, but keeps getting pulled away by ordinary
              life.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill tone="brand">Gentle structure</Pill>
              <Pill tone="accent">No shame-driven copy</Pill>
              <Pill tone="warn">Return-focused</Pill>
            </div>
          </div>

          <div className={styles.reflectionGrid}>
            {REALITY_COLUMNS.map((item) => {
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
                The return does not need to begin with intensity. It needs to begin with honesty.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Hifzer tries to make the next step ready before motivation is fully there, so your
                return can be built on sincerity instead of emotional pressure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
