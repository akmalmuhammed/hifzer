"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BookOpen, PenLine, RotateCcw, Sunrise } from "lucide-react";
import { Pill } from "@/components/ui/pill";

const FEATURES = [
  {
    id: "reader",
    icon: BookOpen,
    label: "Qur'an reader",
    tag: "Reader",
    tagTone: "brand" as const,
    headline: "Return to the exact ayah.",
    body: "Resume where you stopped, keep audio close, and move forward without hunting for your place.",
    preview: {
      type: "reader" as const,
      surah: "Al-Mulk · 67:4",
      arabic: "ثُمَّ ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ ٱلْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ",
      translation: "Then return your vision twice again. Your vision will return to you humbled while it is fatigued.",
      meta: ["Last read tonight", "Bookmark saved", "Audio ready"],
    },
  },
  {
    id: "review",
    icon: RotateCcw,
    label: "Review queue",
    tag: "Review",
    tagTone: "accent" as const,
    headline: "Keep weak areas in view.",
    body: "Review stays inside the same routine, so the parts that need attention come forward before they drift.",
    preview: {
      type: "review" as const,
      title: "Today's review",
      subtitle: "12 minutes planned",
      items: [
        { label: "Needs attention", note: "2 ayahs from Al-Mulk" },
        { label: "Due soon", note: "5 ayahs from Ya-Sin" },
        { label: "Steady", note: "11 ayahs staying in rotation" },
      ],
      footer: "Review moves forward when you miss days.",
    },
  },
  {
    id: "morning",
    icon: Sunrise,
    label: "Morning adhkar",
    tag: "Dua",
    tagTone: "brand" as const,
    headline: "Open your daily duas without leaving the routine.",
    body: "Arabic, transliteration, and meaning are ready when you need them.",
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
    id: "journal",
    icon: PenLine,
    label: "Private journal",
    tag: "Journal",
    tagTone: "warn" as const,
    headline: "Write down what you want to remember.",
    body: "Save private notes next to the ayah or day that mattered.",
    preview: {
      type: "journal" as const,
      surah: "Al-Baqarah · 2:286",
      arabic: "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
      note: "Needed this reminder tonight. Allah does not burden a soul beyond what it can bear. Keeping this here to return to again.",
      date: "Today",
    },
  },
] as const;

type Feature = (typeof FEATURES)[number];

function ReaderPreview({ preview }: { preview: Extract<Feature["preview"], { type: "reader" }> }) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
            Current place
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[color:var(--kw-ink)]">{preview.surah}</p>
        </div>
        <Pill tone="brand" className="shrink-0 self-start">Saved</Pill>
      </div>

      <div className="grid min-h-[16rem] place-items-center rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-5 py-6 md:px-6">
        <div className="w-full max-w-[40rem]">
          <p
            className="text-right font-[family-name:var(--font-quran-uthmani)] text-[1.45rem] leading-[2.4] text-[color:var(--kw-ink)]"
            dir="rtl"
          >
            {preview.arabic}
          </p>
          <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">{preview.translation}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {preview.meta.map((item) => (
          <div
            key={item}
            className="rounded-[14px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 py-2 text-center text-[11px] font-semibold text-[color:var(--kw-ink-2)]"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewPreview({ preview }: { preview: Extract<Feature["preview"], { type: "review" }> }) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
          {preview.title}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[color:var(--kw-ink)]">{preview.subtitle}</p>
      </div>

      <div className="flex flex-col gap-2">
        {preview.items.map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-4 py-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[14px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.06)] px-3 py-2">
        <p className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">{preview.footer}</p>
      </div>
    </div>
  );
}

function DuaPreview({ preview }: { preview: Extract<Feature["preview"], { type: "dua" }> }) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
            {preview.title}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[color:var(--kw-ink)]">{preview.subtitle}</p>
        </div>
        <Pill tone="brand" className="shrink-0 self-start">{preview.progress}/{preview.total}</Pill>
      </div>

      <div className="grid min-h-[16rem] place-items-center rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-5 py-6 md:px-6">
        <div className="w-full max-w-[40rem]">
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
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
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

function PreviewPanel({ feature }: { feature: Feature }) {
  const preview = feature.preview;
  if (preview.type === "reader") return <ReaderPreview preview={preview} />;
  if (preview.type === "review") return <ReviewPreview preview={preview} />;
  if (preview.type === "dua") return <DuaPreview preview={preview} />;
  return <JournalPreview preview={preview} />;
}

export function SessionWalkthrough() {
  const [activeId, setActiveId] = useState<string>(FEATURES[0].id);
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const active = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0];

  function focusTab(nextIndex: number) {
    const next = FEATURES[(nextIndex + FEATURES.length) % FEATURES.length];
    setActiveId(next.id);
    tabRefs.current[(nextIndex + FEATURES.length) % FEATURES.length]?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTab(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTab(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(FEATURES.length - 1);
    }
  }

  return (
    <section className="py-12 md:py-16">
      {/* Section header */}
      <div className="mb-8 md:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
          How it works
        </p>
        <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
          See the main parts before you sign up.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">
          The reader stays central. Review, duas, and private notes sit around it instead of
          sending you across separate tools.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] md:items-start">
        {/* Left — feature tabs */}
        <div className="flex flex-col gap-2" role="tablist" aria-label="Session walkthrough features">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            const isActive = feature.id === activeId;
            const tabId = `session-walkthrough-tab-${feature.id}`;
            const panelId = "session-walkthrough-panel";
            return (
              <motion.button
                key={feature.id}
                type="button"
                id={tabId}
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                ref={(node) => {
                  tabRefs.current[idx] = node;
                }}
                onClick={() => setActiveId(feature.id)}
                onKeyDown={(event) => handleTabKeyDown(event, idx)}
                initial={false}
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
          id="session-walkthrough-panel"
          role="tabpanel"
          aria-labelledby={`session-walkthrough-tab-${active.id}`}
          tabIndex={0}
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduceMotion ? 0 : 0.45 }}
          className="kw-glass-strong flex min-h-[30rem] flex-col rounded-[var(--kw-radius-xl)] px-5 py-5"
        >
          {/* Feature header */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id + "-header"}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="mb-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0 pr-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--kw-faint)]">
                  {active.tag}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[color:var(--kw-ink)]">{active.headline}</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--kw-muted)]">
                  {active.body}
                </p>
              </div>
              <Pill tone={active.tagTone} className="shrink-0 self-start">{active.tag}</Pill>
            </motion.div>
          </AnimatePresence>

          {/* Preview content */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id + "-content"}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              className="min-h-0 flex-1"
            >
              <PreviewPanel feature={active} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
