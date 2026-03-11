"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const MOTIVATION_ROTATE_MS = 6800;

const QURAN_MOTIVATION_MESSAGES = [
  {
    title: "Recite the Qur'an. It will intercede for you.",
    accent: "Keep one protected daily return to it.",
    detail:
      "Open the Book every day and let recitation become companionship, not an occasional burst.",
    sourceLabel: "Sahih Muslim 804a",
    sourceHref: "https://sunnah.com/muslim:804a",
  },
  {
    title: "The best of you are those who learn the Qur'an and teach it.",
    accent: "Begin by giving your own tongue a daily share.",
    detail:
      "Small, consistent recitation is stronger than waiting for a perfect future routine.",
    sourceLabel: "Sahih al-Bukhari 5027",
    sourceHref: "https://sunnah.com/bukhari:5027",
  },
  {
    title: "This Qur'an guides to what is most upright.",
    accent: "Return to it for direction before you return to everything else.",
    detail:
      "Use the reader as a daily doorway into guidance, correction, and softness of heart.",
    sourceLabel: "Qur'an 17:9",
    sourceHref: "https://quran.com/17/9",
  },
  {
    title: "Those who recite Allah's Book can hope for a trade that never fails.",
    accent: "Every protected page is part of a lasting investment.",
    detail:
      "Even when your schedule is tight, steady recitation still counts with Allah.",
    sourceLabel: "Qur'an 35:29-30",
    sourceHref: "https://quran.com/35/29-30",
  },
] as const;

export function QuranMotivationHero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % QURAN_MOTIVATION_MESSAGES.length);
    }, MOTIVATION_ROTATE_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="relative min-h-[15.5rem] overflow-hidden rounded-[30px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[linear-gradient(135deg,var(--kw-card-strong),var(--kw-surface-strong))] px-5 py-5 shadow-[var(--kw-shadow)] sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute -left-12 top-0 h-40 w-40 rounded-full bg-[rgba(var(--kw-accent-rgb),0.10)] blur-2xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-36 w-36 rounded-full bg-[rgba(255,152,52,0.10)] blur-2xl" />

      <div className="relative z-[1]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.10)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(var(--kw-accent-rgb),1)]">
            <Sparkles size={12} />
            Authentic recitation motivation
          </span>
          <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
            Rotates automatically
          </span>
        </div>

        <div className="relative mt-5 min-h-[10.5rem]">
          {QURAN_MOTIVATION_MESSAGES.map((message, index) => {
            const active = index === activeIndex;
            return (
              <div
                key={message.sourceHref}
                className={`absolute inset-0 transition-all duration-700 ${active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
              >
                <h1 className="text-balance font-[family-name:var(--font-kw-display)] text-4xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
                  {message.title}
                  <span className="mt-2 block text-[rgba(var(--kw-accent-rgb),1)]">{message.accent}</span>
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
                  {message.detail}
                </p>
                <a
                  href={message.sourceHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/75 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]"
                >
                  {message.sourceLabel}
                  <ArrowRight size={13} />
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {QURAN_MOTIVATION_MESSAGES.map((message, index) => (
            <button
              key={message.sourceHref}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-[rgba(var(--kw-accent-rgb),1)]" : "w-2.5 bg-black/10"}`}
              aria-label={`Show message ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
