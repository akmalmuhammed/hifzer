"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpenText, Loader2, MessageSquareQuote, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Pill } from "@/components/ui/pill";
import { LANDING_GUIDANCE_DEMO } from "./grounded-guidance-demo.data";
import styles from "./grounded-guidance-demo.module.css";

const DEMO_STEPS = [
  {
    id: "explain-loading",
    view: "explain",
    loading: true,
    bubble: "Explain this ayah",
    loader: "Grounding this ayah with ayah text, translation, and tafsir context...",
    duration: 1250,
  },
  {
    id: "explain-ready",
    view: "explain",
    loading: false,
    bubble: "Explain this ayah",
    loader: "",
    duration: 3600,
  },
  {
    id: "assistant-loading",
    view: "assistant",
    loading: true,
    bubble: LANDING_GUIDANCE_DEMO.assistant.prompt,
    loader: "Searching grounded Qur'an matches for patience...",
    duration: 1250,
  },
  {
    id: "assistant-ready",
    view: "assistant",
    loading: false,
    bubble: LANDING_GUIDANCE_DEMO.assistant.prompt,
    loader: "",
    duration: 4200,
  },
] as const;

function SourcePills({ sources }: { sources: readonly { label: string; kind: string }[] }) {
  return (
    <div className={styles.sourceRow}>
      {sources.map((source) => (
        <Pill key={`${source.kind}:${source.label}`} tone="neutral">
          {source.label}
        </Pill>
      ))}
    </div>
  );
}

function LoadingCard({ detail }: { detail: string }) {
  return (
    <div className={styles.loaderCard}>
      <div className={styles.loaderTopline}>
        <Loader2 size={16} className="animate-spin text-[color:var(--kw-faint)]" />
        <span>{detail}</span>
      </div>
      <div className={styles.loaderBar} aria-hidden>
        <span />
      </div>
    </div>
  );
}

function ExplanationResult() {
  const { explain } = LANDING_GUIDANCE_DEMO;

  return (
    <div className={styles.resultCard}>
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles size={15} className="text-[color:var(--kw-faint)]" aria-hidden />
        <p className={styles.sectionLabel}>Explanation insights</p>
      </div>
      <p className={styles.answerText}>{explain.summary}</p>
      <div className={styles.themeRow}>
        {explain.keyThemes.map((theme) => (
          <span key={theme} className={styles.themeChip}>
            {theme}
          </span>
        ))}
      </div>
      <div className={styles.insightCard}>
        <div className={styles.insightHeader}>
          <BookOpenText size={14} className="text-[color:var(--kw-faint)]" aria-hidden />
          <p className={styles.insightTitle}>{explain.tafsirInsight.title}</p>
          <Pill tone="neutral">{explain.tafsirInsight.source}</Pill>
        </div>
        <p className={styles.insightText}>{explain.tafsirInsight.detail}</p>
      </div>
      <SourcePills sources={explain.sources} />
    </div>
  );
}

function AssistantResult() {
  const { assistant } = LANDING_GUIDANCE_DEMO;

  return (
    <div className={styles.resultCard}>
      <div className="flex flex-wrap items-center gap-2">
        <MessageSquareQuote size={15} className="text-[color:var(--kw-faint)]" aria-hidden />
        <p className={styles.sectionLabel}>Grounded answer</p>
      </div>
      <p className={styles.answerText}>{assistant.answer}</p>
      <div className={styles.matches}>
        {assistant.matches.map((match) => (
          <article key={match.verseKey} className={styles.matchCard}>
            <div className={styles.matchTopline}>
              <Pill tone="neutral">{match.verseKey}</Pill>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                <Search size={12} aria-hidden />
                Matched ayah
              </span>
            </div>
            <p dir="rtl" className={styles.matchArabic}>
              {match.arabicText}
            </p>
            {match.translation ? (
              <p dir={match.translation.direction} className={styles.matchTranslation}>
                {match.translation.text}
              </p>
            ) : null}
            <p className={styles.insightText}>{match.tafsirSummary}</p>
            <SourcePills sources={match.sources} />
          </article>
        ))}
      </div>
    </div>
  );
}

export function GroundedGuidanceDemo() {
  const reduceMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const step = DEMO_STEPS[stepIndex] ?? DEMO_STEPS[0];
  const showStatic = Boolean(reduceMotion);
  const explainActive = showStatic || step.view === "explain";
  const activePrompt = showStatic || step.view === "assistant" ? LANDING_GUIDANCE_DEMO.assistant.prompt : null;

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStepIndex((current) => (current + 1) % DEMO_STEPS.length);
    }, step.duration);

    return () => window.clearTimeout(timer);
  }, [reduceMotion, step.duration]);

  return (
    <div className={styles.shell}>
      <div className={styles.motionGrid} aria-hidden />
      <div className={styles.orbOne} aria-hidden />
      <div className={styles.orbTwo} aria-hidden />

      <div className={styles.header}>
        <div className={styles.pills}>
          <Pill tone="accent">AI assistant</Pill>
          <Pill tone="neutral">Quran MCP grounded</Pill>
        </div>
        <span className={styles.sampleLabel}>Stored sample</span>
      </div>

      <div className={styles.ayahCard}>
        <div className={styles.ayahMeta}>
          <span className={styles.verseKey}>{LANDING_GUIDANCE_DEMO.currentAyah.verseKey}</span>
          <span className={styles.translationLabel}>{LANDING_GUIDANCE_DEMO.currentAyah.translation.label}</span>
        </div>
        <p dir="rtl" className={styles.arabicLine}>
          {LANDING_GUIDANCE_DEMO.currentAyah.arabicText}
        </p>
        <p className={styles.translation}>{LANDING_GUIDANCE_DEMO.currentAyah.translation.text}</p>
      </div>

      <div className={styles.actionRow}>
        <span
          className={clsx(
            styles.explainButton,
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[color:var(--kw-ink)] transition",
            explainActive
              ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)]"
              : "border-[color:var(--kw-border-2)] bg-white/80",
            explainActive && styles.explainActive,
          )}
        >
          <Sparkles size={15} aria-hidden />
          {LANDING_GUIDANCE_DEMO.explain.prompt}
        </span>

        <div className={styles.promptRail} aria-label="Sample predefined AI questions">
          {LANDING_GUIDANCE_DEMO.promptOptions.map((prompt) => (
            <span
              key={prompt}
              className={clsx(
                styles.promptChip,
                "rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-1.5 text-left text-xs font-semibold text-[color:var(--kw-ink)] transition",
                activePrompt === prompt && styles.promptActive,
              )}
            >
              {prompt}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.conversation} aria-live="polite">
        <AnimatePresence mode="wait">
          {!showStatic ? (
            <motion.div
              key={`bubble:${step.id}`}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.28 }}
              className={styles.bubble}
            >
              <MessageSquareQuote size={15} aria-hidden />
              <span>{step.bubble}</span>
            </motion.div>
          ) : (
            <div className={styles.bubble}>
              <MessageSquareQuote size={15} aria-hidden />
              <span>Explain this ayah, then ask a predefined question.</span>
            </div>
          )}
        </AnimatePresence>

        <div className={styles.resultZone}>
          {showStatic ? (
            <div className={styles.staticStack}>
              <ExplanationResult />
              <AssistantResult />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`result:${step.id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.34, ease: "easeOut" }}
              >
                {step.loading ? (
                  <LoadingCard detail={step.loader} />
                ) : step.view === "explain" ? (
                  <ExplanationResult />
                ) : (
                  <AssistantResult />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
