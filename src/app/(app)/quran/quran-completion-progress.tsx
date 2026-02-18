"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Medal, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import styles from "./quran-completion-progress.module.css";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const KHATMAH_COUNT_KEY = "hifzer_khatmah_count_v1";
const LAST_SEEN_AYAH_KEY = "hifzer_khatmah_last_seen_ayah_v1";
const COMPLETION_WINDOW_AYAHS = 120;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseStoredInt(raw: string | null): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value: number): string {
  if (value >= 99.95) {
    return "100.0";
  }
  return value.toFixed(1);
}

type KhatmahTier = {
  threshold: number;
  badge: string;
  title: string;
  subtitle: string;
};

const KHATMAH_TIERS: KhatmahTier[] = [
  {
    threshold: 1,
    badge: "Khatmah I",
    title: "Khatmah Al-Ula",
    subtitle: "First complete recitation",
  },
  {
    threshold: 2,
    badge: "Khatmah II",
    title: "Khatmah Ath-Thaniyah",
    subtitle: "Second complete recitation",
  },
  {
    threshold: 3,
    badge: "Khatmah III",
    title: "Khatmah Ath-Thalithah",
    subtitle: "Third complete recitation",
  },
  {
    threshold: 5,
    badge: "Khatmah V",
    title: "Maqam Al-Muraja'ah",
    subtitle: "Strong review consistency",
  },
  {
    threshold: 10,
    badge: "Khatmah X",
    title: "Maqam Al-Itqan",
    subtitle: "Deep consistency and refinement",
  },
  {
    threshold: 20,
    badge: "Khatmah XX",
    title: "Ahl Al-Qur'an Path",
    subtitle: "Long-term devotion milestone",
  },
];

const SEEKER_TIER: KhatmahTier = {
  threshold: 0,
  badge: "Seeker",
  title: "Talib Al-Qur'an",
  subtitle: "Complete one full khatmah to unlock rank badges.",
};

type QuranCompletionProgressProps = {
  currentAyahId: number;
  totalAyahs: number;
  currentSurahNumber: number;
  currentAyahNumber: number;
  initialKhatmahCount: number;
  resumeHref: string;
};

export function QuranCompletionProgress(props: QuranCompletionProgressProps) {
  const safeTotalAyahs = Math.max(1, props.totalAyahs);
  const targetProgress = useMemo(
    () => clamp((props.currentAyahId / safeTotalAyahs) * 100, 0, 100),
    [props.currentAyahId, safeTotalAyahs],
  );
  const progressRef = useRef(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [khatmahCount, setKhatmahCount] = useState(() => Math.max(0, Math.floor(props.initialKhatmahCount)));

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      progressRef.current = targetProgress;
      setDisplayProgress(targetProgress);
      return;
    }

    const from = progressRef.current;
    const to = targetProgress;
    const start = performance.now();
    const durationMs = 1200;
    let frame = 0;

    const tick = (timestamp: number) => {
      const elapsed = clamp((timestamp - start) / durationMs, 0, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const next = from + (to - from) * eased;
      progressRef.current = next;
      setDisplayProgress(next);
      if (elapsed < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [targetProgress]);

  useEffect(() => {
    const baselineCount = Math.max(0, Math.floor(props.initialKhatmahCount));
    const storedCount = parseStoredInt(window.localStorage.getItem(KHATMAH_COUNT_KEY));
    const previousAyah = parseStoredInt(window.localStorage.getItem(LAST_SEEN_AYAH_KEY));
    let nextCount = Math.max(baselineCount, storedCount ?? 0);

    const clampedCurrentAyah = clamp(props.currentAyahId, 1, safeTotalAyahs);
    const completionWindowStart = Math.max(1, safeTotalAyahs - COMPLETION_WINDOW_AYAHS);
    const reachedQuranEnd = clampedCurrentAyah >= safeTotalAyahs;
    const cameFromFinalWindow = previousAyah != null && previousAyah >= completionWindowStart && previousAyah < safeTotalAyahs;

    if (reachedQuranEnd && cameFromFinalWindow) {
      nextCount += 1;
    }
    if (reachedQuranEnd) {
      nextCount = Math.max(nextCount, 1);
    }

    setKhatmahCount(nextCount);
    window.localStorage.setItem(KHATMAH_COUNT_KEY, String(nextCount));
    window.localStorage.setItem(LAST_SEEN_AYAH_KEY, String(clampedCurrentAyah));
  }, [props.currentAyahId, props.initialKhatmahCount, safeTotalAyahs]);

  const completedAyahs = clamp(Math.round((displayProgress / 100) * safeTotalAyahs), 0, safeTotalAyahs);
  const remainingAyahs = safeTotalAyahs - completedAyahs;
  const currentTier = useMemo(() => {
    let tier = SEEKER_TIER;
    for (const candidate of KHATMAH_TIERS) {
      if (khatmahCount >= candidate.threshold) {
        tier = candidate;
      }
    }
    return tier;
  }, [khatmahCount]);
  const nextTier = useMemo(
    () => KHATMAH_TIERS.find((candidate) => candidate.threshold > khatmahCount) ?? null,
    [khatmahCount],
  );
  const completionsToNextTier = nextTier ? nextTier.threshold - khatmahCount : 0;
  const ringStyle: CSSProperties = {
    background: `conic-gradient(
      rgba(var(--kw-accent-rgb), 0.96) ${displayProgress}%,
      rgba(var(--kw-accent-rgb), 0.14) ${displayProgress}% 100%
    )`,
  };

  return (
    <Card className={`px-5 py-6 sm:px-6 ${styles.card}`}>
      <div className={styles.ambient} />
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />

      <div className="relative grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
        <div className="mx-auto lg:mx-0">
          <div className={styles.ring} style={ringStyle}>
            <div className={styles.ringInner}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--kw-faint)]">Completion</p>
              <p className="mt-1 font-[family-name:var(--font-kw-display)] text-4xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {formatPercent(displayProgress)}%
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {NUMBER_FORMATTER.format(completedAyahs)} / {NUMBER_FORMATTER.format(safeTotalAyahs)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">Total Qur&apos;an progress</Pill>
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgba(var(--kw-accent-rgb),1)]">
              <Sparkles size={12} />
              Live
            </span>
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            Surah {props.currentSurahNumber}:{props.currentAyahNumber} checkpoint
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            You have completed {NUMBER_FORMATTER.format(completedAyahs)} ayahs so far.{" "}
            {NUMBER_FORMATTER.format(remainingAyahs)} ayahs remain to complete the full Qur&apos;an.
          </p>

          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${displayProgress}%` }} />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className={styles.statCard}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--kw-faint)]">Completed</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {NUMBER_FORMATTER.format(completedAyahs)}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--kw-faint)]">Remaining</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {NUMBER_FORMATTER.format(remainingAyahs)}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--kw-faint)]">Current</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {props.currentSurahNumber}:{props.currentAyahNumber}
              </p>
            </div>
          </div>

          <div className={styles.rankSection}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--kw-faint)]">Khatmah rank track</p>
              <span className={styles.rankCountPill}>
                <Medal size={12} />
                x{khatmahCount}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">{currentTier.title}</p>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">{currentTier.subtitle}</p>
              </div>
              <span className={styles.currentRankBadge}>{currentTier.badge}</span>
            </div>
            <p className="mt-3 text-xs text-[color:var(--kw-faint)]">
              {nextTier
                ? `${completionsToNextTier} more completion${completionsToNextTier === 1 ? "" : "s"} to unlock ${nextTier.title}.`
                : "All rank badges unlocked. Maintain your muraja'ah flow and consistency."}
            </p>
            <div className={styles.badgeGrid}>
              {KHATMAH_TIERS.map((tier) => {
                const unlocked = khatmahCount >= tier.threshold;
                const active = unlocked && currentTier.threshold === tier.threshold;
                return (
                  <div
                    key={tier.threshold}
                    className={`${styles.badgeItem} ${unlocked ? styles.badgeItemUnlocked : styles.badgeItemLocked} ${
                      active ? styles.badgeItemActive : ""
                    }`}
                  >
                    <p className={styles.badgeItemCount}>x{tier.threshold}</p>
                    <p className={styles.badgeItemName}>{tier.badge}</p>
                    <p className={styles.badgeItemTitle}>{tier.title}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href={props.resumeHref}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.3)] bg-[rgba(var(--kw-accent-rgb),0.14)] px-4 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
          >
            Continue reading
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </Card>
  );
}
