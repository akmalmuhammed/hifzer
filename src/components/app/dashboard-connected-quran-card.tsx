"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, AudioLines, BookMarked, FileText, LibraryBig, RefreshCcw, Sparkles, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import {
  getQuranFoundationFeedbackLabel,
  hasQuranFoundationGrantedScope,
  isQuranFoundationReconnectRequired,
  isQuranFoundationScopeApprovalBlocked,
} from "@/hifzer/quran-foundation/feedback";
import type { QuranFoundationConnectedOverview, QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";
import styles from "./dashboard-connected-quran-card.module.css";

const ADVANCED_SYNC_SCOPES = [
  "activity_day",
  "reading_session",
  "collection",
  "streak",
  "note",
] as const;

type OverviewPayload = {
  ok: true;
  status: QuranFoundationConnectionStatus;
  overview: QuranFoundationConnectedOverview | null;
};

type CardMode = "full" | "simple";

function connectionStateLabel(state: QuranFoundationConnectionStatus["state"]): string {
  if (state === "connected") {
    return "Connected";
  }
  if (state === "degraded") {
    return "Needs attention";
  }
  if (state === "disconnected") {
    return "Not connected";
  }
  return "Unavailable";
}

function formatReadingPlaceValue(overview: QuranFoundationConnectedOverview | null): string {
  if (!overview?.readingSession) {
    return "Not saved yet";
  }
  return `Surah ${overview.readingSession.surahNumber}:${overview.readingSession.ayahNumber}`;
}

function formatReadingPlaceDetail(overview: QuranFoundationConnectedOverview | null): string {
  if (!overview?.readingSession?.updatedAt) {
    return "Your place in the Qur'an can follow you here.";
  }
  return `Last updated ${new Date(overview.readingSession.updatedAt).toLocaleString()}`;
}

function formatStreakValue(overview: QuranFoundationConnectedOverview | null): string {
  return overview?.streak ? `${overview.streak.currentDays} days` : "No streak yet";
}

function formatStreakDetail(overview: QuranFoundationConnectedOverview | null): string {
  if (!overview?.streak) {
    return "Your Quran.com streak will appear here as you keep going.";
  }
  return overview.streak.bestDays ? `Best ${overview.streak.bestDays} days` : "Connected through Quran.com";
}

function formatFoldersValue(overview: QuranFoundationConnectedOverview | null): string {
  return overview?.collections ? `${overview.collections.count} folders` : "No folders yet";
}

function formatFoldersDetail(overview: QuranFoundationConnectedOverview | null): string {
  if ((overview?.collections?.count ?? 0) === 0) {
    return "Your bookmark folders can stay together here.";
  }
  return "Bookmark folders are available from Quran.com.";
}

function formatNotesValue(overview: QuranFoundationConnectedOverview | null): string {
  return overview?.notes ? `${overview.notes.count} notes` : "No notes yet";
}

function formatNotesDetail(overview: QuranFoundationConnectedOverview | null): string {
  if ((overview?.notes?.count ?? 0) === 0) {
    return "Private reflections and notes can stay connected.";
  }
  return "Notes from Quran.com are ready inside Hifzer.";
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

export function DashboardConnectedQuranCard(props: { mode?: CardMode }) {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mode = props.mode ?? "full";
  const simpleMode = mode === "simple";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/quran-foundation/overview", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as (OverviewPayload & { error?: string }) | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to load Quran.com overview.");
      }
      if (!data?.status) {
        throw new Error("Quran.com overview was empty.");
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
  const feedbackParam = searchParams.get("qf");
  const feedback = useMemo(() => getQuranFoundationFeedbackLabel(feedbackParam), [feedbackParam]);
  const missingAdvancedScopes = useMemo(
    () => (status ? ADVANCED_SYNC_SCOPES.filter((scope) => !status.scopes.includes(scope)) : []),
    [status],
  );
  const reconnectRequired = isQuranFoundationReconnectRequired(status);
  const needsRelink = Boolean(connected && missingAdvancedScopes.length > 0);
  const scopeApprovalBlocked = isQuranFoundationScopeApprovalBlocked(status, feedbackParam);
  const hasReadingSessionScope = Boolean(
    status && hasQuranFoundationGrantedScope(status.scopes, "reading_session", "reading_session.read"),
  );
  const hasStreakReadScope = Boolean(
    status && hasQuranFoundationGrantedScope(status.scopes, "streak", "streak.read"),
  );
  const hasCollectionScope = Boolean(
    status && hasQuranFoundationGrantedScope(status.scopes, "collection", "collection.read"),
  );
  const hasNoteScope = Boolean(
    status && hasQuranFoundationGrantedScope(status.scopes, "note", "note.read"),
  );

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
                <Pill tone="warn">Quran.com</Pill>
              </div>
              <p className="mt-3 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
                Quran.com connection unavailable
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                {error ?? "The dashboard could not load the linked Quran.com state right now."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" className="gap-2" onClick={() => void load()}>
                Try again <RefreshCcw size={15} />
              </Button>
              <Link href="/settings/quran-foundation">
                <Button size="sm" className="gap-2">
                  Manage Quran.com <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const stateTone = status.state === "connected" ? "accent" : status.state === "degraded" ? "warn" : "neutral";

  if (simpleMode) {
    return (
      <Card className={styles.panel}>
        <div className="space-y-4">
          <div className={styles.header}>
            <div className={styles.summary}>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={stateTone}>Quran.com</Pill>
                {connected ? <Pill tone="neutral">Connected</Pill> : null}
              </div>
              <p className="mt-3 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {connected
                  ? "Your reading place, bookmarks, and notes can stay together."
                  : "Connect Quran.com whenever you want your reading place and saved items to follow you here."}
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                {connected
                  ? "Continue in the reader now, and Hifzer will keep your Quran.com reading place, bookmarks, and notes close by."
                  : "This is optional. You can start with Hifz or reading first, then connect Quran.com later when you want everything in one place."}
              </p>
              {connected && hasReadingSessionScope && overview?.readingSession ? (
                <p className="mt-3 text-xs text-[color:var(--kw-faint)]">
                  Latest reading place: Surah {overview.readingSession.surahNumber}:{overview.readingSession.ayahNumber}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {connected ? (
                reconnectRequired || needsRelink ? (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      window.location.href = "/api/quran-foundation/connect?returnTo=%2Fdashboard";
                    }}
                  >
                    Reconnect Quran.com <ArrowRight size={15} />
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
                  Connect Quran.com <ArrowRight size={15} />
                </Button>
              )}
              <Link href="/settings/quran-foundation">
                <Button variant="secondary" size="sm" className="gap-2">
                  Manage Quran.com <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </div>

          {feedback ? <div className={styles.warning}>{feedback}</div> : null}

          {connected && (status.state === "degraded" || needsRelink) ? (
            <div className={styles.warning}>
              {reconnectRequired
                ? "This Quran.com connection needs to be renewed before syncing can continue."
                : needsRelink
                  ? scopeApprovalBlocked
                    ? "Quran.com has not enabled the newest permissions for Hifzer yet. Your connection is safe, but some extras are still waiting."
                    : "Reconnect once so Hifzer can sync your reading place, bookmark folders, and notes more fully."
                  : status.detail}
            </div>
          ) : null}

          <div className={styles.featureRail}>
            <span className={styles.featurePill}><Waves size={14} /> Reading place</span>
            <span className={styles.featurePill}><BookMarked size={14} /> Bookmarks</span>
            <span className={styles.featurePill}><FileText size={14} /> Notes</span>
            {status.contentApiReady ? (
              <span className={styles.featurePill}><AudioLines size={14} /> Official tafsir and audio</span>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.panel}>
      <div className="space-y-4">
        <div className={styles.header}>
          <div className={styles.summary}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={stateTone}>Quran.com</Pill>
              <Pill tone={stateTone}>{connectionStateLabel(status.state)}</Pill>
              {status.contentApiReady ? <Pill tone="neutral">Official tafsir and audio</Pill> : null}
              {needsRelink ? (
                <Pill tone="warn">Reconnect needed</Pill>
              ) : null}
            </div>
            <p className="mt-3 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
              {simpleMode
                ? connected
                  ? "Your Quran.com journey stays together here."
                  : "Bring your Quran.com journey into Hifzer when you're ready."
                : connected
                  ? "Keep your reading place, bookmarks, and notes together."
                  : "Connect Quran.com to continue where you left off."}
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              {simpleMode
                ? connected
                  ? "Open the Qur'an reader to pick up your reading place, or manage the bookmarks and notes you want to keep in sync."
                  : "When you connect Quran.com, your reading place, bookmarks, and notes can stay together inside Hifzer."
                : connected
                  ? status.contentApiReady
                    ? "Your reading place, bookmark folders, notes, and official tafsir and audio are ready from one calmer place."
                    : "Your reading place, bookmark folders, and notes are ready inside Hifzer."
                  : "Link Quran.com so your reading place, bookmarks, and notes can travel with you."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {connected ? (
              reconnectRequired ? (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    window.location.href = "/api/quran-foundation/connect?returnTo=%2Fdashboard";
                  }}
                >
                  Reconnect Quran.com <ArrowRight size={15} />
                </Button>
              ) : needsRelink ? (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    window.location.href = "/api/quran-foundation/connect?returnTo=%2Fdashboard";
                  }}
                >
                  Reconnect Quran.com <ArrowRight size={15} />
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
                Connect Quran.com <ArrowRight size={15} />
              </Button>
            )}
            <Link href="/settings/quran-foundation">
              <Button variant="secondary" size="sm" className="gap-2">
                Manage Quran.com <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        </div>

        {feedback ? <div className={styles.warning}>{feedback}</div> : null}

        {connected && (status.state === "degraded" || needsRelink) ? (
          <div className={styles.warning}>
            {reconnectRequired
              ? "This Quran.com connection needs to be renewed before syncing can continue."
              : needsRelink ? (
              scopeApprovalBlocked
                ? "Quran.com has not enabled the newest permissions for Hifzer yet. Your connection is safe, but some extras are still waiting."
                : "Reconnect once so Hifzer can sync your reading place, bookmark folders, and notes more fully."
            ) : status.detail}
          </div>
        ) : null}

        <div className={styles.grid}>
          <div className={styles.stat}>
            <p className={styles.statLabel}>Reading place</p>
            <p className={styles.statValue}>
              {connected
                ? hasReadingSessionScope
                  ? formatReadingPlaceValue(overview)
                  : "Reconnect needed"
                : "Ready when you connect"}
            </p>
            <p className={styles.statDetail}>
              {connected
                ? hasReadingSessionScope
                  ? formatReadingPlaceDetail(overview)
                  : "Reconnect once to sync your reading place."
                : "Carry your Quran.com reading place into Hifzer."}
            </p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statLabel}>Bookmark folders</p>
            <p className={styles.statValue}>
              {connected
                ? hasCollectionScope
                  ? formatFoldersValue(overview)
                  : "Reconnect needed"
                : "Ready when you connect"}
            </p>
            <p className={styles.statDetail}>
              {connected
                ? hasCollectionScope
                  ? formatFoldersDetail(overview)
                  : "Reconnect once to sync bookmark folders."
                : "Bring your bookmark folders with you when you connect."}
            </p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statLabel}>Notes and reflections</p>
            <p className={styles.statValue}>
              {connected
                ? hasNoteScope
                  ? formatNotesValue(overview)
                  : "Reconnect needed"
                : "Ready when you connect"}
            </p>
            <p className={styles.statDetail}>
              {connected
                ? hasNoteScope
                  ? formatNotesDetail(overview)
                  : "Reconnect once to sync notes and reflections."
                : "Keep private notes and reflections connected when you want."}
            </p>
          </div>
          {!simpleMode ? (
            <div className={styles.stat}>
              <p className={styles.statLabel}>Quran.com streak</p>
              <p className={styles.statValue}>
                {connected
                  ? hasStreakReadScope
                    ? formatStreakValue(overview)
                    : "Reconnect needed"
                  : "Visible after you connect"}
              </p>
              <p className={styles.statDetail}>
                {connected
                  ? hasStreakReadScope
                    ? formatStreakDetail(overview)
                    : "Reconnect once to show your Quran.com streak here."
                  : "Your Quran.com streak can stay visible alongside your Hifzer rhythm."}
              </p>
            </div>
          ) : null}
        </div>

        <div className={styles.featureRail}>
          <span className={styles.featurePill}><BookMarked size={14} /> Bookmarks</span>
          <span className={styles.featurePill}><LibraryBig size={14} /> Bookmark folders</span>
          <span className={styles.featurePill}><Waves size={14} /> Reading place</span>
          <span className={styles.featurePill}><FileText size={14} /> Notes</span>
          {status.contentApiReady ? (
            <>
              <span className={styles.featurePill}><AudioLines size={14} /> Official audio</span>
              <span className={styles.featurePill}><Sparkles size={14} /> Answers with sources</span>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
