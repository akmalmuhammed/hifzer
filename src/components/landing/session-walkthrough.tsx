"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BookOpen, PenLine, Moon, Heart, Sunrise } from "lucide-react";
import { Pill } from "@/components/ui/pill";

const FEATURES = [
  {
    id: "morning",
    icon: Sunrise,
    label: "Morning adhkar",
    tag: "Dua",
    tagTone: "brand" as const,
    headline: "Start every day with intention.",
    body: "Simple morning adhkar with Arabic, transliteration, and meaning.",
    preview: {
      type: "dua" as const,
      title: "Morning adhkar",
      subtitle: "Ayah al-Kursi",
      arabic: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ",
      transliteration: "Allahu la ilaha illa huwa al-Ḥayyu al-Qayyum",
      source: "Surah Al-Baqarah 2:255",
      progress: 3,
      total: 12,
    },
  },
  {
    id: "evening",
    icon: Moon,
    label: "Evening adhkar",
    tag: "Dua",
    tagTone: "brand" as const,
    headline: "End the day with gratitude.",
    body: "Evening duas that are easy to follow and return to each day.",
    preview: {
      type: "dua" as const,
      title: "Evening adhkar",
      subtitle: "Seeking protection",
      arabic: "أَعُوذُ بِكَلِمَاتِ ٱللَّهِ ٱلتَّامَّاتِ مِن شَرِّ مَا خَلَقَ",
      transliteration: "A'udhu bi kalimatillahi at-tammati min sharri ma khalaq",
      source: "Sahih Muslim 2708",
      progress: 7,
      total: 10,
    },
  },
  {
    id: "hardship",
    icon: Heart,
    label: "Duas for hardship",
    tag: "Dua",
    tagTone: "brand" as const,
    headline: "Turn to Allah in difficulty.",
    body: "Guided supplications for patience, relief, and trust when life feels heavy.",
    preview: {
      type: "dua" as const,
      title: "In times of distress",
      subtitle: "Dua of Yunus",
      arabic: "لَّآ إِلَٰهَ إِلَّآ أَنتَ سُبْحَٰنَكَ إِنِّى كُنتُ مِنَ ٱلظَّٰلِمِينَ",
      transliteration: "La ilaha illa anta subhanaka inni kuntu min az-zalimin",
      source: "Surah Al-Anbiya 21:87",
      progress: 2,
      total: 8,
    },
  },
  {
    id: "journal",
    icon: PenLine,
    label: "Spiritual journal",
    tag: "Journal",
    tagTone: "accent" as const,
    headline: "Capture what moves you.",
    body: "Write private reflections and tie them to the ayah you are reading.",
    preview: {
      type: "journal" as const,
      surah: "Al-Baqarah · 2:286",
      arabic: "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
      note: "This ayah hit differently today. Allah does not burden a soul beyond what it can bear. I needed this reminder during a hard week. Going to memorise this one first.",
      date: "Today",
    },
  },
  {
    id: "milestones",
    icon: BookOpen,
    label: "Track milestones",
    tag: "Journal",
    tagTone: "accent" as const,
    headline: "See how far you have come.",
    body: "Save milestones, remembered ayahs, and meaningful days in one place.",
    preview: {
      type: "milestones" as const,
      entries: [
        { label: "First juz completed", date: "3 months ago", icon: "🎯" },
        { label: "30-day streak reached", date: "6 weeks ago", icon: "🔥" },
        { label: "Al-Fatiha fully memorised", date: "Yesterday", icon: "✨" },
      ],
    },
  },
] as const;

type Feature = (typeof FEATURES)[number];

function DuaPreview({ preview }: { preview: Extract<Feature["preview"], { type: "dua" }> }) {
  return (
    <div className="grid h-full min-h-[28rem] grid-rows-[auto_1fr_auto] gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
            {preview.title}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[color:var(--kw-ink)]">{preview.subtitle}</p>
        </div>
        <Pill tone="brand">{preview.progress}/{preview.total}</Pill>
      </div>

      <div className="grid min-h-[20rem] place-items-center rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-5 py-5">
        <div className="w-full max-w-[44rem]">
        <p
          className="text-right font-[family-name:var(--font-quran-uthmani)] text-[1.45rem] leading-[2.4] text-[color:var(--kw-ink)]"
          dir="rtl"
        >
          {preview.arabic}
        </p>
        <p className="mt-3 text-center text-[11px] italic text-[color:var(--kw-muted)]">
          {preview.transliteration}
        </p>
        </div>
      </div>

      <div className="rounded-[14px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[color:var(--kw-faint)]">Source</p>
        <p className="mt-0.5 text-sm font-semibold text-[color:var(--kw-ink)]">{preview.source}</p>
      </div>
    </div>
  );
}

function JournalPreview({ preview }: { preview: Extract<Feature["preview"], { type: "journal" }> }) {
  return (
    <div className="grid h-full min-h-[28rem] grid-rows-[auto_1fr] gap-3">
      <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-4 pb-4 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
          {preview.surah}
        </p>
        <p
          className="mt-2 text-right font-[family-name:var(--font-quran-uthmani)] text-[1.3rem] leading-[2.2] text-[color:var(--kw-ink)]"
          dir="rtl"
        >
          {preview.arabic}
        </p>
      </div>

      <div className="flex-1 rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[color:var(--kw-faint)]">
            My reflection
          </p>
          <span className="text-[10px] text-[color:var(--kw-faint)]">{preview.date}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{preview.note}</p>
      </div>
    </div>
  );
}

function MilestonesPreview({ preview }: { preview: Extract<Feature["preview"], { type: "milestones" }> }) {
  return (
    <div className="grid h-full min-h-[28rem] grid-rows-[auto_1fr_auto] gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
        Your journey
      </p>
      <div className="flex flex-1 flex-col gap-2">
        {preview.entries.map((entry) => (
          <div
            key={entry.label}
            className="flex items-center gap-3 rounded-[16px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-4 py-3"
          >
            <span className="text-xl">{entry.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{entry.label}</p>
              <p className="text-[11px] text-[color:var(--kw-faint)]">{entry.date}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-[14px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.06)] px-3 py-2 text-center">
        <p className="text-[11px] font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
          Every milestone saved, always yours.
        </p>
      </div>
    </div>
  );
}

function PreviewPanel({ feature }: { feature: Feature }) {
  const preview = feature.preview;
  if (preview.type === "dua") return <DuaPreview preview={preview} />;
  if (preview.type === "journal") return <JournalPreview preview={preview} />;
  return <MilestonesPreview preview={preview} />;
}

export function SessionWalkthrough() {
  const [activeId, setActiveId] = useState<string>(FEATURES[0].id);
  const reduceMotion = useReducedMotion();

  const active = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0];

  return (
    <section className="py-12 md:py-16">
      {/* Section header */}
      <div className="mb-8 md:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
          Your companion
        </p>
        <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
          More than just Hifz.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">
          Dua and reflection live alongside your daily Hifz routine.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-stretch">
        {/* Left — feature tabs */}
        <div className="flex flex-col gap-2">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            const isActive = feature.id === activeId;
            return (
              <motion.button
                key={feature.id}
                type="button"
                onClick={() => setActiveId(feature.id)}
                initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, delay: idx * 0.05 }}
                className={[
                  "group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 rounded-[20px] border px-4 py-4 text-left transition-all duration-200",
                  isActive
                    ? "border-[rgba(var(--kw-accent-rgb),0.3)] bg-[rgba(var(--kw-accent-rgb),0.07)] shadow-[var(--kw-shadow-soft)]"
                    : "border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] hover:bg-[color:var(--kw-surface-soft)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors",
                    isActive
                      ? "border-[rgba(var(--kw-accent-rgb),0.25)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]",
                  ].join(" ")}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={["min-w-0 text-sm font-semibold", isActive ? "text-[color:var(--kw-ink)]" : "text-[color:var(--kw-ink-2)]"].join(" ")}>
                      {feature.label}
                    </p>
                    <Pill tone={feature.tagTone} className="shrink-0">
                      {feature.tag}
                    </Pill>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--kw-muted)]">{feature.headline}</p>
                </div>
                <span
                  className={[
                    "mt-1 h-1.5 w-1.5 rounded-full transition-opacity",
                    isActive ? "bg-[rgba(var(--kw-accent-rgb),0.8)] opacity-100" : "opacity-0",
                  ].join(" ")}
                />
              </motion.button>
            );
          })}
        </div>

        {/* Right — dynamic preview panel */}
        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduceMotion ? 0 : 0.45 }}
          className="kw-glass-strong min-h-[34rem] rounded-[var(--kw-radius-xl)] px-5 py-5"
        >
          {/* Feature header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id + "-header"}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="mb-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
                  {active.tag}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[color:var(--kw-ink)]">{active.headline}</p>
              </div>
              <Pill tone={active.tagTone}>{active.tag}</Pill>
            </motion.div>
          </AnimatePresence>

          {/* Preview content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id + "-content"}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              className="h-full"
            >
              <PreviewPanel feature={active} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
