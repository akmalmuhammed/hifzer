"use client";

import type { CSSProperties } from "react";
import { BookOpenCheck, LockKeyhole, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import styles from "./quran-completion-progress.module.css";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

type QuranCompletionProgressProps = {
  completionPct: number;
  completedAyahCount: number;
  totalAyahs: number;
  currentSurahNumber: number;
  currentAyahNumber: number;
  completedKhatmahCount: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value: number): string {
  return value >= 99.95 ? "100.0" : value.toFixed(1);
}

export function QuranCompletionProgress(props: QuranCompletionProgressProps) {
  const safeTotalAyahs = Math.max(1, Math.floor(props.totalAyahs));
  const displayProgress = clamp(props.completionPct, 0, 100);
  const completedAyahs = clamp(Math.floor(props.completedAyahCount), 0, safeTotalAyahs);
  const remainingAyahs = safeTotalAyahs - completedAyahs;
  const completeReadings = Math.max(0, Math.floor(props.completedKhatmahCount));
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
          <div
            className={styles.ring}
            style={ringStyle}
            role="progressbar"
            aria-label="Qur'an reading coverage"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Number(displayProgress.toFixed(1))}
          >
            <div className={styles.ringInner}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--kw-faint)]">Read so far</p>
              <p className="mt-1 font-[family-name:var(--font-kw-display)] text-4xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {formatPercent(displayProgress)}%
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {NUMBER_FORMATTER.format(completedAyahs)} / {NUMBER_FORMATTER.format(safeTotalAyahs)} ayahs read
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">Total Qur&apos;an progress</Pill>
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgba(var(--kw-accent-rgb),1)]">
              <Sparkles size={12} aria-hidden="true" />
              From your reading
            </span>
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            Last place: {props.currentSurahNumber}:{props.currentAyahNumber}
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            You have read {NUMBER_FORMATTER.format(completedAyahs)} unique ayahs so far. {NUMBER_FORMATTER.format(remainingAyahs)} ayahs remain for full coverage.
          </p>

          <div
            className={styles.track}
            role="progressbar"
            aria-label="Unique ayahs read"
            aria-valuemin={0}
            aria-valuemax={safeTotalAyahs}
            aria-valuenow={completedAyahs}
          >
            <div className={styles.fill} style={{ width: `${displayProgress}%` }} />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className={styles.statCard}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--kw-faint)]">Read</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{NUMBER_FORMATTER.format(completedAyahs)}</p>
            </div>
            <div className={styles.statCard}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--kw-faint)]">Left</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{NUMBER_FORMATTER.format(remainingAyahs)}</p>
            </div>
            <div className={styles.statCard}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--kw-faint)]">Last place</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{props.currentSurahNumber}:{props.currentAyahNumber}</p>
            </div>
          </div>

          <div className={styles.rankSection}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpenCheck size={15} className="text-[rgba(var(--kw-accent-rgb),1)]" aria-hidden="true" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--kw-faint)]">Private reading history</p>
              </div>
              <span className={styles.rankCountPill}>
                <LockKeyhole size={12} aria-hidden="true" />
                Only you
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
              {completeReadings === 0
                ? "No complete readings recorded yet"
                : `${NUMBER_FORMATTER.format(completeReadings)} complete reading${completeReadings === 1 ? "" : "s"} recorded`}
            </p>
            <p className="mt-2 text-xs leading-6 text-[color:var(--kw-muted)]">
              This is a neutral record of reading completed in Hifzer. It is not a measure of devotion or spiritual standing, and it is never shown publicly.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
