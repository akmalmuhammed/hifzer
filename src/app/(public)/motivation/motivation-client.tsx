"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { TrackedLink } from "@/components/telemetry/tracked-link";

type MotivationTile = {
  category: "Hifz" | "Qur'an" | "Progress";
  title: string;
  source: string;
};

const MOTIVATION_TILES: MotivationTile[] = [
  { category: "Qur'an", title: "Recite with presence. Every ayah reshapes the heart.", source: "Qur'an 13:28" },
  { category: "Hifz", title: "Small daily memorization beats rare intense sessions.", source: "Sahih al-Bukhari 6464" },
  { category: "Progress", title: "Consistency is your superpower. Protect the streak.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Allah opens doors for those who keep returning.", source: "Qur'an 65:2-3" },
  { category: "Hifz", title: "One clean page today becomes confidence tomorrow.", source: "Hifzer Method" },
  { category: "Progress", title: "You are never behind when you restart with sincerity.", source: "Qur'an 39:53" },
  { category: "Qur'an", title: "The best path forward begins with one recitation now.", source: "Qur'an 73:20" },
  { category: "Hifz", title: "Review is honor. Revision is how memorization survives.", source: "Sahih Muslim 791" },
  { category: "Progress", title: "Build momentum quietly. Let results speak later.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Light enters the heart through repeated remembrance.", source: "Qur'an 29:45" },
  { category: "Hifz", title: "Accuracy first, speed second, barakah always.", source: "Hifzer Method" },
  { category: "Progress", title: "A focused 20 minutes can transform your day.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Recite calmly. Depth grows where haste disappears.", source: "Qur'an 73:4" },
  { category: "Hifz", title: "Guard what you memorized before adding more.", source: "Sahih al-Bukhari 5033" },
  { category: "Progress", title: "Your future self will thank you for today's discipline.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "The Qur'an elevates those who carry it with care.", source: "Sahih Muslim 817" },
  { category: "Hifz", title: "Even one ayah reviewed sincerely is a real win.", source: "Hifzer Method" },
  { category: "Progress", title: "Do not chase perfection. Chase continuity.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Morning recitation sets the tone for the entire day.", source: "Qur'an 17:78" },
  { category: "Hifz", title: "Strong retention is built by returning before forgetting.", source: "Hifzer Method" },
  { category: "Progress", title: "You grow every time you choose the harder right action.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "With hardship comes ease. Keep going.", source: "Qur'an 94:5-6" },
  { category: "Hifz", title: "Memorize less, but memorize with excellence.", source: "Hifzer Method" },
  { category: "Progress", title: "Delayed comfort creates lasting strength.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "The reciter's rank rises with each verse.", source: "Authentic hadith" },
  { category: "Hifz", title: "Your tongue repeats. Your heart records.", source: "Hifzer Method" },
  { category: "Progress", title: "Protect your rhythm and your rhythm will protect you.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Never underestimate one sincere return to Allah.", source: "Qur'an 2:186" },
  { category: "Hifz", title: "Review debt shrinks when you act early.", source: "Hifzer Method" },
  { category: "Progress", title: "The disciplined become unstoppable with time.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Make the Qur'an your daily meeting, not a someday goal.", source: "Qur'an 20:14" },
  { category: "Hifz", title: "Precision in tajweed is respect for revelation.", source: "Qur'an 73:4" },
  { category: "Progress", title: "Tiny wins compound into deep confidence.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Recite for Allah. Recognition is not the reward.", source: "Sahih Muslim 1905" },
  { category: "Hifz", title: "Your review list is a roadmap, not a burden.", source: "Hifzer Method" },
  { category: "Progress", title: "Winners show up when motivation is low.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Hearts soften when words of Allah are repeated.", source: "Qur'an 39:23" },
  { category: "Hifz", title: "The strongest hifz is the hifz you revisit daily.", source: "Hifzer Method" },
  { category: "Progress", title: "Train your habits and your habits will carry you.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Read with humility. Guidance follows humility.", source: "Qur'an 2:2" },
  { category: "Hifz", title: "Slow correction today prevents major gaps later.", source: "Hifzer Method" },
  { category: "Progress", title: "Stay patient. Growth is happening underneath.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Your recitation is seen, heard, and rewarded.", source: "Qur'an 99:7" },
  { category: "Hifz", title: "Daily return beats weekly panic.", source: "Hifzer Method" },
  { category: "Progress", title: "Commitment creates the life inspiration talks about.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "Recite and ascend. Keep climbing by ayah.", source: "Jami at-Tirmidhi 2914" },
  { category: "Hifz", title: "Protect old pages so new pages can stay.", source: "Hifzer Method" },
  { category: "Progress", title: "Show up now. Your next level starts here.", source: "Hifzer Principle" },
  { category: "Qur'an", title: "The Book is mercy. Hold it daily.", source: "Qur'an 10:57" },
  { category: "Hifz", title: "One session done with ihsan is never small.", source: "Sahih Muslim 1955" },
  { category: "Qur'an", title: "Remember Allah often. A remembered heart stays alive.", source: "Qur'an 2:152" },
  { category: "Progress", title: "Ask for strength through patience and prayer.", source: "Qur'an 2:153" },
  { category: "Progress", title: "Your load is never beyond what Allah knows you can carry.", source: "Qur'an 2:286" },
  { category: "Progress", title: "Do not lose heart. Do not fall into grief.", source: "Qur'an 3:139" },
  { category: "Progress", title: "When Allah supports you, opposition cannot defeat you.", source: "Qur'an 3:160" },
  { category: "Progress", title: "Stay patient, stand firm, and remain ready.", source: "Qur'an 3:200" },
  { category: "Qur'an", title: "Verses that are recited should move the heart and increase faith.", source: "Qur'an 8:2" },
  { category: "Progress", title: "Do not dispute and lose your momentum.", source: "Qur'an 8:46" },
  { category: "Qur'an", title: "Answer the call that gives your life real meaning.", source: "Qur'an 8:24" },
  { category: "Progress", title: "Nothing reaches you except what Allah has written with wisdom.", source: "Qur'an 9:51" },
  { category: "Progress", title: "Real success is only through Allah's help.", source: "Qur'an 11:88" },
  { category: "Progress", title: "Seek forgiveness and return. Mercy opens again.", source: "Qur'an 11:90" },
  { category: "Progress", title: "Never despair of relief from Allah.", source: "Qur'an 12:87" },
  { category: "Progress", title: "Change starts inside before it appears outside.", source: "Qur'an 13:11" },
  { category: "Progress", title: "Thankfulness grows what you already have.", source: "Qur'an 14:7" },
  { category: "Progress", title: "A righteous life brings a good life.", source: "Qur'an 16:97" },
  { category: "Progress", title: "Allah stays with those who stay mindful and do good.", source: "Qur'an 16:128" },
  { category: "Qur'an", title: "The Qur'an guides to what is most upright.", source: "Qur'an 17:9" },
  { category: "Hifz", title: "Ask for mercy and guidance before every struggle.", source: "Qur'an 18:10" },
  { category: "Progress", title: "Youthful faith can still move mountains with guidance.", source: "Qur'an 18:13" },
  { category: "Qur'an", title: "Keep asking: My Lord, increase me in knowledge.", source: "Qur'an 20:114" },
  { category: "Qur'an", title: "Allah is the Light that steadies every path.", source: "Qur'an 24:35" },
  { category: "Progress", title: "Sincere repentance can transform your record.", source: "Qur'an 25:70" },
  { category: "Hifz", title: "Strive for Allah and He opens new paths.", source: "Qur'an 29:69" },
  { category: "Progress", title: "Follow the Prophetic example when your direction feels blurry.", source: "Qur'an 33:21" },
  { category: "Progress", title: "Do not be deceived by temporary life. Keep your eyes on truth.", source: "Qur'an 35:5" },
  { category: "Progress", title: "Knowledge and ignorance are never equal. Keep learning.", source: "Qur'an 39:9" },
  { category: "Progress", title: "Call on Allah with certainty. He responds.", source: "Qur'an 40:60" },
  { category: "Progress", title: "Steadfast hearts receive peace from above.", source: "Qur'an 41:30" },
  { category: "Progress", title: "Repel harm with excellence and watch outcomes change.", source: "Qur'an 41:34" },
  { category: "Progress", title: "Patience with forgiveness is a mark of real resolve.", source: "Qur'an 42:43" },
  { category: "Progress", title: "Support Allah's cause and He supports your steps.", source: "Qur'an 47:7" },
  { category: "Qur'an", title: "Allah sends tranquility into hearts that believe.", source: "Qur'an 48:4" },
  { category: "Progress", title: "Do not let your heart harden away from remembrance.", source: "Qur'an 57:16" },
  { category: "Progress", title: "Allah raises those who believe and seek knowledge.", source: "Qur'an 58:11" },
  { category: "Progress", title: "Prepare today for what your soul sends ahead.", source: "Qur'an 59:18" },
  { category: "Progress", title: "When your heart trusts Allah, it is guided.", source: "Qur'an 64:11" },
  { category: "Progress", title: "After difficulty, Allah creates ease.", source: "Qur'an 65:7" },
  { category: "Progress", title: "Turn back sincerely. Honest repentance renews everything.", source: "Qur'an 66:8" },
  { category: "Hifz", title: "Night recitation leaves deeper marks on the soul.", source: "Qur'an 73:6" },
  { category: "Hifz", title: "Remember your Lord constantly and devote your focus.", source: "Qur'an 73:8" },
  { category: "Progress", title: "Allah can open easier roads than you imagined.", source: "Qur'an 87:8" },
  { category: "Progress", title: "Success belongs to the one who purifies and remembers.", source: "Qur'an 87:14-15" },
  { category: "Progress", title: "What is ahead can be better than what is behind.", source: "Qur'an 93:4" },
  { category: "Progress", title: "When one task ends, rise for the next one.", source: "Qur'an 94:7" },
  { category: "Progress", title: "Direct your longing to Allah alone.", source: "Qur'an 94:8" },
  { category: "Hifz", title: "Begin with Bismillah. Read in your Lord's Name.", source: "Qur'an 96:1" },
  { category: "Progress", title: "Time is your capital. Guard it with faith and action.", source: "Qur'an 103:1-3" },
  { category: "Progress", title: "Wisdom is a gift that unlocks abundant good.", source: "Qur'an 2:269" },
  { category: "Progress", title: "Seek help in patience and prayer, even when it feels heavy.", source: "Qur'an 2:45" },
];

function tileBackgroundClass(index: number) {
  const variant = index % 5;

  if (variant === 0) return "bg-[linear-gradient(150deg,rgba(var(--kw-accent-rgb),0.2)_0%,var(--kw-surface-strong)_72%)]";
  if (variant === 1) return "bg-[linear-gradient(160deg,rgba(20,184,166,0.2)_0%,var(--kw-surface-strong)_72%)]";
  if (variant === 2) return "bg-[linear-gradient(145deg,rgba(148,163,184,0.16)_0%,var(--kw-surface)_68%)]";
  if (variant === 3) return "bg-[linear-gradient(155deg,rgba(99,102,241,0.2)_0%,var(--kw-surface-strong)_74%)]";

  return "bg-[linear-gradient(160deg,rgba(14,116,144,0.18)_0%,var(--kw-surface-strong)_76%)]";
}

function splitGradientTextClass(isLarge = false) {
  return [
    "bg-[linear-gradient(94deg,var(--kw-ink)_0_54%,rgba(var(--kw-accent-rgb),1)_54%_100%)]",
    "bg-clip-text text-transparent",
    isLarge ? "text-[clamp(1.28rem,6.3vw,2.3rem)]" : "text-[clamp(1.05rem,2.2vw,1.9rem)]",
    "font-extrabold leading-[1.08] tracking-[-0.025em]",
  ].join(" ");
}

export function MotivationClientPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeTile = useMemo(
    () => (activeIndex === null ? null : MOTIVATION_TILES[activeIndex] ?? null),
    [activeIndex],
  );

  useEffect(() => {
    if (activeTile === null) return;

    const originalOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeTile]);

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 text-center md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
            Motivation Grid
          </p>
          <h1 className="kw-marketing-display mt-2 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] md:text-5xl">
            100 Daily Creatives for Hifz, Qur&apos;an, and Progress
          </h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[color:var(--kw-border)] bg-[color:var(--kw-border)] p-px shadow-[var(--kw-shadow-soft)]">
          <div className="grid gap-px bg-[color:var(--kw-border)] [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {MOTIVATION_TILES.map((tile, index) => (
              <button
                key={`${tile.title}-${index}`}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                }}
                className={`relative aspect-[9/16] cursor-pointer overflow-hidden p-4 text-left md:p-5 ${tileBackgroundClass(index)}`}
                aria-label={`Open creative: ${tile.title}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(var(--kw-accent-rgb),0.22),transparent_45%),radial-gradient(circle_at_82%_88%,rgba(148,163,184,0.18),transparent_40%)]" />
                <div className="relative flex h-full flex-col">
                  <p className="inline-flex w-fit rounded-full border border-[color:var(--kw-border)] bg-[color:var(--kw-surface-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-ink-2)]">
                    {tile.category}
                  </p>

                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <h2 className={`${splitGradientTextClass()} text-balance`}>{tile.title}</h2>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                      {tile.source}
                    </p>
                  </div>

                  <p className="text-center text-[11px] font-semibold text-[color:var(--kw-teal-800)]">
                    Join Hifzer
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[color:var(--kw-faint)]">
          <TrackedLink href="/" telemetryName="motivation.back-home" className="underline underline-offset-2">
            Back to home
          </TrackedLink>
        </p>
      </div>

      {activeTile ? (
        <div
          className="fixed inset-0 z-[90] bg-[rgba(11,18,32,0.84)] p-3 backdrop-blur-sm md:p-6"
          onClick={() => {
            setActiveIndex(null);
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveIndex(null);
            }}
            aria-label="Close full screen creative"
            className="absolute right-4 top-4 z-[91] inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white"
          >
            <X size={18} />
          </button>

          <div className="grid h-full place-items-center">
            <div
              onClick={(event) => {
                event.stopPropagation();
              }}
              className={`relative aspect-[9/16] h-full max-h-full w-full max-w-[560px] overflow-hidden rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] md:p-8 ${tileBackgroundClass(activeIndex ?? 0)}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(var(--kw-accent-rgb),0.22),transparent_45%),radial-gradient(circle_at_82%_88%,rgba(148,163,184,0.18),transparent_40%)]" />
              <div className="relative flex h-full flex-col">
                <p className="inline-flex w-fit rounded-full border border-[color:var(--kw-border)] bg-[color:var(--kw-surface-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-ink-2)]">
                  {activeTile.category}
                </p>

                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <h2 className={`${splitGradientTextClass(true)} text-balance`}>{activeTile.title}</h2>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                    {activeTile.source}
                  </p>
                </div>

                <p className="text-center text-sm font-semibold text-[color:var(--kw-teal-800)]">
                  Join Hifzer
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
