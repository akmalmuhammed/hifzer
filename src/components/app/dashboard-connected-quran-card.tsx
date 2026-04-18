"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, AudioLines, BookMarked, FileText, LibraryBig, RefreshCcw, Sparkles, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { QuranFoundationConnectedOverview, QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";
import styles from "./dashboard-connected-quran-card.module.css";

const ADVANCED_SYNC_SCOPES = [
  "activity_day",
  "streak.read",
  "goal.read",
  "reading_session",
  "collection",
  "note",
] as const;

type OverviewPayload = {
  ok: true;
  status: QuranFoundationConnectionStatus;
  overview: QuranFoundationConnectedOverview | null;
};

function formatResumePoint(overview: QuranFoundationConnectedOverview | null): string {
  if (!overview?.readingSession) {
    return "Waiting for sync";
  }
  return `Surah ${overview.readingSession.surahNumber}:${overview.readingSession.ayahNumber}`;
}

function formatResumeDetail(overview: QuranFoundationConnectedOverview | null): string {
  if (!overview?.readingSession?.updatedAt) {
    return "Your Quran.com reading place can resume inside Hifzer.";
  }
  return `Updated ${new Date(overview.readingSession.updatedAt).toLocaleString()}`;
}

function formatStreakValue(overview: QuranFoundationConnectedOverview | null): string {
  return overview?.streak ? `${overview.streak.currentDays} days` : "No streak yet";
}

function formatStreakDetail(overview: QuranFoundationConnectedOverview | null): string {
  if (!overview?.streak) {
    return "Activity-day sync keeps the Quran.com streak current.";
  }
  return overview.streak.bestDays ? `Best ${overview.streak.bestDays} days` : "Connected through Quran.com";
}

function formatGoalValue(overview: QuranFoundationConnectedOverview | null): string {
  return overview?.goalPlan?.title ?? "No goal found";
}

function formatGoalDetail(overview: QuranFoundationConnectedOverview | null): string {
  return overview?.goalPlan?.remaining ?? "If you set a Quran.com goal, it will appear here.";
}

function formatMemoryValue(overview: QuranFoundationConnectedOverview | null): string {
  const collections = overview?.collections?.count ?? 0;
  const notes = overview?.notes?.count ?? 0;
  return `${collections} collections / ${notes} notes`;
}

function formatMemoryDetail(overview: QuranFoundationConnectedOverview | null): string {
  if ((overview?.collections?.count ?? 0) === 0 && (overview?.notes?.count ?? 0) === 0) {
    return "Bookmarks, collections, and notes can travel with you.";
  }
  return "Hifzer can import or mirror the Quran.com memory layer.";
}

function LoadingState() {
  return (
    <Card className={styles.panel}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-7 w-28 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
        </div>
        <div className="h-7 w-60 animate-pulse rounded-2xl bg-[color:var(--kw-skeleton)]" />
        <div className="h-4 w-[70%] animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="min-h-[110px] animate-pulse rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-skeleton)]" />
          ))}
        </div>
      </div>
    </Card>
  );
}

export function DashboardConnectedQuranCard() {
  const [payload, setPayload] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/quran-foundation/overview", { cache: "no-store" });
      const data = (await response.json()) as OverviewPayload & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load Quran.com overview.");
      }
      setPayload(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load Quran.com overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const status = payload?.status ?? null;
  const overview = payload?.overview ?? null;
  const connected = status?.state === "connected" || status?.state === "degraded";
  const missingAdvancedScopes = useMemo(
    () => (status ? ADVANCED_SYNC_SCOPES.filter((scope) => !status.scopes.includes(scope)) : []),
    [status],
  );
  const needsRelink = Boolean(connected && missingAdvancedScopes.length > 0);

  if (loading && !payload) {
    return <LoadingState />;
  }

  if (!payload || !status) {
    return (
      <Card className={styles.panel}>
        <div className="space-y-4">
          <div className={styles.header}>
            <div className={styles.summary}>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="warn">Connected Quran</Pill>
              </div>
              <p className="mt-3 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
                Quran.com overview unavailable
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                {error ?? "The dashboard could not load the linked Quran.com state right now."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" className="gap-2" onClick={() => void load()}>
                Retry <RefreshCcw size={15} />
              </Button>
              <Link href="/settings/quran-foundation">
                <Button size="sm" className="gap-2">
                  Manage connection <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const stateTone = status.state === "connected" ? "accent" : status.state === "degraded" ? "warn" : "neutral";

  return (
    <Card className={styles.panel}>
      <div className="space-y-4">
        <div className={styles.header}>
          <div className={styles.summary}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={stateTone}>Connected Quran</Pill>
              <Pill tone={status.userApiReady ? "neutral" : "warn"}>User API</Pill>
              <Pill tone={status.contentApiReady ? "neutral" : "warn"}>Content API</Pill>
              {needsRelink ? <Pill tone="warn">Refresh permissions</Pill> : null}
            </div>
            <p className="mt-3 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
              {connected
                ? "Quran.com state is part of your return flow in Hifzer."
                : "Bring Quran.com into the same return flow you use in Hifzer."}
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              {connected
                ? "Resume points, goals, streaks, collections, notes, and official reader layers stay visible from one calmer dashboard."
                : "Link Quran.com so Hifzer can surface synced reading state, bookmarks, goals, notes, and official content directly in the reader."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {connected ? (
              needsRelink ? (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    window.location.href = "/api/quran-foundation/connect?returnTo=%2Fdashboard";
                  }}
                >
                  Refresh permissions <ArrowRight size={15} />
                </Button>
              ) : (
                <Link href="/quran/read?view=compact">
                  <Button size="sm" className="gap-2">
                    Open reader <ArrowRight size={15} />
                  </Button>
                </Link>
              )
            ) : (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  window.location.href = "/api/quran-foundation/connect?returnTo=%2Fdashboard";
                }}
              >
                Link Quran.com <ArrowRight size={15} />
              </Button>
            )}
            <Link href="/settings/quran-foundation">
              <Button variant="secondary" size="sm" className="gap-2">
                Manage connection <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        </div>

        {connected && (status.state === "degraded" || needsRelink) ? (
          <div className={styles.warning}>
            {needsRelink
              ? "This account is linked, but it still has the older Quran.com scopes. Reconnect once to unlock goal, streak, reading-session, collection, and notes permissions for the demo flow."
              : status.detail}
          </div>
        ) : null}

        <div className={styles.grid}>
          <div className={styles.stat}>
            <p className={styles.statLabel}>Resume point</p>
            <p className={styles.statValue}>{connected ? formatResumePoint(overview) : "Link account"}</p>
            <p className={styles.statDetail}>{connected ? formatResumeDetail(overview) : "Carry your Quran.com reading place into Hifzer."}</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statLabel}>Quran.com streak</p>
            <p className={styles.statValue}>{connected ? formatStreakValue(overview) : "Ready to sync"}</p>
            <p className={styles.statDetail}>{connected ? formatStreakDetail(overview) : "Activity-day sync can keep the external streak visible."}</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statLabel}>Today&apos;s goal</p>
            <p className={styles.statValue}>{connected ? formatGoalValue(overview) : "Goals stay visible"}</p>
            <p className={styles.statDetail}>{connected ? formatGoalDetail(overview) : "If a Quran.com goal exists, Hifzer can surface it here."}</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statLabel}>Synced memory</p>
            <p className={styles.statValue}>{connected ? formatMemoryValue(overview) : "Bookmarks / notes"}</p>
            <p className={styles.statDetail}>{connected ? formatMemoryDetail(overview) : "Bookmarks, collections, and notes can stay connected to your reading."}</p>
          </div>
        </div>

        <div className={styles.featureRail}>
          <span className={styles.featurePill}><LibraryBig size={14} /> Official translation</span>
          <span className={styles.featurePill}><FileText size={14} /> Official tafsir</span>
          <span className={styles.featurePill}><AudioLines size={14} /> Official audio</span>
          <span className={styles.featurePill}><BookMarked size={14} /> Bookmark sync</span>
          <span className={styles.featurePill}><Waves size={14} /> Reading sessions</span>
          <span className={styles.featurePill}><Sparkles size={14} /> Grounded AI</span>
        </div>
      </div>
    </Card>
  );
}
