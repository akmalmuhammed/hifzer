"use client";

import clsx from "clsx";
import { BookOpenText, MessageSquareQuote, Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Pill } from "@/components/ui/pill";
import { LANDING_GUIDANCE_DEMO } from "./grounded-guidance-demo.data";
import styles from "./grounded-guidance-demo.module.css";

const DEMO_STEPS = [
  {
    id: "explain-ready",
    view: "explain",
    bubble: "Explain this ayah",
    duration: 9000,
  },
  {
    id: "assistant-ready",
    view: "assistant",
    bubble: LANDING_GUIDANCE_DEMO.assistant.prompt,
    duration: 11000,
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
        {assistant.matches.slice(0, 1).map((match) => (
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
  const shellRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const step = DEMO_STEPS[stepIndex] ?? DEMO_STEPS[0];
  const showStatic = Boolean(reduceMotion);
  const explainActive = showStatic || step.view === "explain";
  const activePrompt = showStatic || step.view === "assistant" ? LANDING_GUIDANCE_DEMO.assistant.prompt : null;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);

    const node = shellRef.current;
    const observer = node
      ? new IntersectionObserver(([entry]) => setIsInView(Boolean(entry?.isIntersecting)), {
          rootMargin: "200px 0px",
        })
      : null;
    if (node) observer?.observe(node);

    return () => {
      media.removeEventListener("change", updatePreference);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || !isInView) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStepIndex((current) => (current + 1) % DEMO_STEPS.length);
    }, step.duration);

    return () => window.clearTimeout(timer);
  }, [isInView, reduceMotion, step.duration]);

  return (
    <div ref={shellRef} className={styles.shell}>
      <div className={styles.motionGrid} aria-hidden />
      <div className={styles.orbOne} aria-hidden />
      <div className={styles.orbTwo} aria-hidden />

      <div className={styles.header}>
        <div className={styles.pills}>
          <Pill tone="accent">Ask Qur&apos;an</Pill>
          <Pill tone="neutral">Grounded in trusted Qur&apos;an sources</Pill>
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

      <div className={styles.conversation}>
        <div key={`bubble:${step.id}`} className={`${styles.bubble} ${styles.stageEnter}`}>
          <MessageSquareQuote size={15} aria-hidden />
          <span>{showStatic ? "Explain this ayah, then ask a predefined question." : step.bubble}</span>
        </div>

        <div className={styles.resultZone}>
          {showStatic ? (
            <ExplanationResult />
          ) : (
            <div key={`result:${step.id}`} className={styles.stageEnter}>
              {step.view === "explain" ? <ExplanationResult /> : <AssistantResult />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
