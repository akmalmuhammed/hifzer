"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Medal, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import styles from "./quran-completion-progress.module.css";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

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
  completionPct: number;
  completedAyahCount: number;
  totalAyahs: number;
  currentSurahNumber: number;
  currentAyahNumber: number;
  completedKhatmahCount: number;
  resumeHref: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value: number): string {
  if (value >= 99.95) {
    return "100.0";
  }
  return value.toFixed(1);
}

export function QuranCompletionProgress(props: QuranCompletionProgressProps) {
  const safeTotalAyahs = Math.max(1, Math.floor(props.totalAyahs));
  const displayProgress = clamp(props.completionPct, 0, 100);
  const completedAyahs = clamp(Math.floor(props.completedAyahCount), 0, safeTotalAyahs);
  const remainingAyahs = safeTotalAyahs - completedAyahs;
  const khatmahCount = Math.max(0, Math.floor(props.completedKhatmahCount));

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
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--kw-faint)]">Read coverage</p>
              <p className="mt-1 font-[family-name:var(--font-kw-display)] text-4xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {formatPercent(displayProgress)}%
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {NUMBER_FORMATTER.format(completedAyahs)} / {NUMBER_FORMATTER.format(safeTotalAyahs)} ayahs tracked
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">Total Qur&apos;an progress</Pill>
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgba(var(--kw-accent-rgb),1)]">
              <Sparkles size={12} />
              Read-based
            </span>
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            Last tracked ayah: {props.currentSurahNumber}:{props.currentAyahNumber}
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            You have tracked {NUMBER_FORMATTER.format(completedAyahs)} unique ayahs from Qur&apos;an browsing.
            {" "}{NUMBER_FORMATTER.format(remainingAyahs)} ayahs remain for full coverage.
          </p>

          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${displayProgress}%` }} />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className={styles.statCard}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--kw-faint)]">Tracked</p>
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--kw-faint)]">Last</p>
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
