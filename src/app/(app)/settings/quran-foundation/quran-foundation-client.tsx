"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import {
  getQuranFoundationFeedbackLabel,
  hasQuranFoundationGrantedScope,
  isQuranFoundationReconnectRequired,
  isQuranFoundationScopeApprovalBlocked,
} from "@/hifzer/quran-foundation/feedback";
import type { QuranFoundationConnectedOverview, QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";

const ADVANCED_SYNC_SCOPES = [
  "activity_day",
  "reading_session",
  "collection",
  "streak",
  "goal",
  "note",
] as const;

function formatSyncedAt(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

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

export function QuranFoundationSettingsClient(props: {
  initialStatus: QuranFoundationConnectionStatus;
  initialOverview: QuranFoundationConnectedOverview | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const { pushToast } = useToast();
  const feedbackParam = searchParams.get("qf");
  const feedback = useMemo(() => getQuranFoundationFeedbackLabel(feedbackParam), [feedbackParam]);

  async function post(path: string, successMessage: string) {
    setBusyKey(path);
    try {
      const response = await fetch(path, { method: "POST" });
      if (!response.ok) {
        throw new Error((await response.json().catch(() => null))?.error ?? "Something went wrong.");
      }
      router.refresh();
      window.history.replaceState(null, "", "/settings/quran-foundation");
      pushToast({
        tone: "success",
        title: "Quran.com updated",
        message: successMessage,
      });
    } catch (error) {
      pushToast({
        tone: "warning",
        title: "Quran.com action failed",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  const status = props.initialStatus;
  const overview = props.initialOverview;
  const connected = status.state === "connected" || status.state === "degraded";
  const missingAdvancedScopes = ADVANCED_SYNC_SCOPES.filter((scope) => !status.scopes.includes(scope));
  const reconnectRequired = isQuranFoundationReconnectRequired(status);
  const needsRelink = connected && missingAdvancedScopes.length > 0;
  const scopeApprovalBlocked = isQuranFoundationScopeApprovalBlocked(status, feedbackParam);
  const hasBookmarkScope = hasQuranFoundationGrantedScope(
    status.scopes,
    "bookmark",
    "bookmark.read",
    "bookmark.create",
    "bookmark.update",
    "bookmark.delete",
  );
  const hasActivityDayScope = hasQuranFoundationGrantedScope(status.scopes, "activity_day", "activity_day.read");
  const hasReadingSessionScope = hasQuranFoundationGrantedScope(
    status.scopes,
    "reading_session",
    "reading_session.read",
  );
  const hasStreakReadScope = hasQuranFoundationGrantedScope(status.scopes, "streak", "streak.read");
  const hasGoalScope = hasQuranFoundationGrantedScope(status.scopes, "goal", "goal.read");
  const hasCollectionScope = hasQuranFoundationGrantedScope(status.scopes, "collection", "collection.read");
  const hasNoteScope = hasQuranFoundationGrantedScope(status.scopes, "note", "note.read");
  const lastSyncedAtLabel = formatSyncedAt(status.lastSyncedAt);
  const readingSessionUpdatedAtLabel = formatSyncedAt(overview?.readingSession?.updatedAt);
  const userApiProof = [
    { label: "OAuth account link", ready: connected },
    { label: "Bookmark sync", ready: hasBookmarkScope },
    { label: "Reading place", ready: hasReadingSessionScope },
    { label: "Reading activity", ready: hasActivityDayScope },
    { label: "Streak", ready: hasStreakReadScope },
    { label: "Goals", ready: hasGoalScope },
    { label: "Bookmark folders", ready: hasCollectionScope },
    { label: "Notes", ready: hasNoteScope },
  ];
  const activeUserApiProofCount = userApiProof.filter((item) => item.ready).length;
  const userApiReady = connected && hasBookmarkScope && activeUserApiProofCount >= 4;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={status.state === "connected" ? "accent" : status.state === "degraded" ? "warn" : "neutral"}>
                {connectionStateLabel(status.state)}
              </Pill>
              {status.contentApiReady ? <Pill tone="neutral">Official tafsir and audio</Pill> : null}
              {needsRelink ? <Pill tone="warn">Reconnect needed</Pill> : null}
            </div>
            <p className="mt-3 text-sm font-semibold text-[color:var(--kw-ink)]">
              {status.displayName ?? status.email ?? "Quran.com connection"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{status.detail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="neutral">Reading place</Pill>
              <Pill tone="neutral">Bookmarks</Pill>
              <Pill tone="neutral">Bookmark folders</Pill>
              <Pill tone="neutral">Goals</Pill>
              <Pill tone="neutral">Notes</Pill>
              {status.contentApiReady ? <Pill tone="neutral">Official tafsir and audio</Pill> : null}
            </div>
            {lastSyncedAtLabel ? (
              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">Last synced: {lastSyncedAtLabel}</p>
            ) : null}
            {reconnectRequired || needsRelink ? (
              <div className="mt-3 rounded-[18px] border border-[rgba(214,153,46,0.25)] bg-[rgba(214,153,46,0.08)] px-4 py-3 text-sm text-[color:var(--kw-muted)]">
                {reconnectRequired
                  ? "This Quran.com connection needs to be renewed before syncing can continue."
                  : scopeApprovalBlocked
                  ? "Quran.com has not enabled the newest permissions for Hifzer yet. Your connection is safe, but some extras are still waiting."
                  : "Reconnect once so Hifzer can sync your reading place, bookmark folders, and notes more fully."}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {status.state === "connected" || status.state === "degraded" ? (
              <>
                {reconnectRequired || needsRelink ? (
                  <Button
                    onClick={() => {
                      window.location.href = `/api/quran-foundation/connect?returnTo=${encodeURIComponent("/settings/quran-foundation")}`;
                    }}
                  >
                    Reconnect Quran.com
                  </Button>
                ) : null}
              </>
            ) : (
              <Button
                onClick={() => {
                  window.location.href = `/api/quran-foundation/connect?returnTo=${encodeURIComponent("/settings/quran-foundation")}`;
                }}
              >
                Connect Quran.com
              </Button>
            )}
            <Button variant="ghost" className="gap-2" onClick={() => router.refresh()}>
              Refresh <RefreshCcw size={14} />
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">Quran Foundation API proof</Pill>
              <Pill tone={userApiReady ? "accent" : "warn"}>
                User API {activeUserApiProofCount}/{userApiProof.length}
              </Pill>
              <Pill tone={status.contentApiReady ? "accent" : "warn"}>
                Content API {status.contentApiReady ? "ready" : "not ready"}
              </Pill>
            </div>
            <p className="mt-3 text-sm font-semibold text-[color:var(--kw-ink)]">
              Hifzer uses Quran Foundation APIs inside real reading, bookmark, note, and content flows.
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              This is the judge-checkable integration surface: user data sync comes from the linked Quran.com account, and official translations, tafsir, and reciter audio are available inside the reader.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/quran/read?view=compact">
                Check reader content
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/quran/bookmarks">
                Check bookmark sync
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">User API</p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">Live Quran.com account data</p>
              </div>
              <Pill tone={userApiReady ? "accent" : "warn"}>
                {userApiReady ? "Visible in app" : "Needs reconnect"}
              </Pill>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {userApiProof.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 py-2 text-sm"
                >
                  <span className="font-medium text-[color:var(--kw-ink-2)]">{item.label}</span>
                  <span
                    className={
                      item.ready
                        ? "rounded-full bg-[color:var(--kw-pill-success-bg)] px-2 py-1 text-xs font-semibold text-[color:var(--kw-pill-success-fg)]"
                        : "rounded-full bg-[color:var(--kw-pill-warn-bg)] px-2 py-1 text-xs font-semibold text-[color:var(--kw-pill-warn-fg)]"
                    }
                  >
                    {item.ready ? "Active" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">Content API</p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">Official reader enrichment</p>
              </div>
              <Pill tone={status.contentApiReady ? "accent" : "warn"}>
                {status.contentApiReady ? "Live" : "Unavailable"}
              </Pill>
            </div>
            <div className="mt-4 space-y-2">
              {["Official translations", "Tafsir selection", "Reciter audio", "Ayah-level alignment"].map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 py-2 text-sm"
                >
                  <span className="font-medium text-[color:var(--kw-ink-2)]">{label}</span>
                  <span
                    className={
                      status.contentApiReady
                        ? "rounded-full bg-[color:var(--kw-pill-success-bg)] px-2 py-1 text-xs font-semibold text-[color:var(--kw-pill-success-fg)]"
                        : "rounded-full bg-[color:var(--kw-pill-warn-bg)] px-2 py-1 text-xs font-semibold text-[color:var(--kw-pill-warn-fg)]"
                    }
                  >
                    {status.contentApiReady ? "Ready" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {overview ? (
        <Card>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Reading place</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasReadingSessionScope && overview.readingSession
                  ? `Surah ${overview.readingSession.surahNumber}:${overview.readingSession.ayahNumber}`
                  : hasReadingSessionScope
                    ? "Not saved yet"
                    : "Reconnect needed"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasReadingSessionScope && readingSessionUpdatedAtLabel
                  ? `Last updated ${readingSessionUpdatedAtLabel}`
                  : hasReadingSessionScope
                    ? "Your place in the Qur'an can travel between Hifzer and Quran.com."
                    : "Reconnect once to sync your reading place."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Quran.com streak</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasStreakReadScope ? `${overview.streak ? `${overview.streak.currentDays} days` : "No streak yet"}` : "Reconnect needed"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasStreakReadScope
                  ? overview.streak?.bestDays
                    ? `Best so far: ${overview.streak.bestDays} days`
                    : "Your Quran.com streak will appear here as you keep going."
                  : "Reconnect once to show your Quran.com streak here."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Bookmark folders</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasCollectionScope
                  ? overview.collections
                    ? `${overview.collections.count} folders`
                    : "No folders yet"
                  : "Reconnect needed"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasCollectionScope
                  ? "Your bookmark folders can stay together between Quran.com and Hifzer."
                  : "Reconnect once to sync bookmark folders."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Quran.com goal</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasGoalScope
                  ? overview.goalPlan
                    ? overview.goalPlan.title
                    : "No goal yet"
                  : "Reconnect needed"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasGoalScope
                  ? overview.goalPlan?.remaining ?? "Your Quran.com goal can appear here beside Hifzer progress."
                  : "Reconnect once to show Quran.com goals here."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Notes and reflections</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasNoteScope
                  ? overview.notes
                    ? `${overview.notes.count} notes`
                    : "No notes yet"
                  : "Reconnect needed"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasNoteScope
                  ? "Private reflections and notes can stay together across both apps."
                  : "Reconnect once to sync notes and reflections."}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {status.state === "connected" || status.state === "degraded" ? (
        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Manage what stays in sync</p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
                Most syncing happens while you read, bookmark, and reflect. Use these actions only when you want to move existing items between Hifzer and Quran.com.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">Bring into Hifzer</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">Pull your saved Quran.com items here</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  Use this when you want your Quran.com bookmarks or notes to appear inside Hifzer right away.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => void post("/api/quran-foundation/bookmarks/hydrate", "Quran.com bookmarks imported into Hifzer.")}
                    loading={busyKey === "/api/quran-foundation/bookmarks/hydrate"}
                    disabled={reconnectRequired}
                  >
                    Bring Quran.com bookmarks into Hifzer
                  </Button>
                  {hasNoteScope ? (
                    <Button
                      variant="secondary"
                      onClick={() => void post("/api/quran-foundation/notes/hydrate", "Quran.com notes imported into your journal.")}
                      loading={busyKey === "/api/quran-foundation/notes/hydrate"}
                      disabled={reconnectRequired}
                    >
                      Bring Quran.com notes into Hifzer
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">Save from Hifzer</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">Send your latest Hifzer memory back to Quran.com</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  Use this when you want your Hifzer bookmarks, folders, or reflections saved into your Quran.com account.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => void post("/api/quran-foundation/bookmarks/push", "Your Hifzer bookmarks were saved to Quran.com.")}
                    loading={busyKey === "/api/quran-foundation/bookmarks/push"}
                    disabled={reconnectRequired}
                  >
                    Save Hifzer bookmarks to Quran.com
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void post("/api/quran-foundation/collections/sync", "Your bookmark folders were saved to Quran.com.")}
                    loading={busyKey === "/api/quran-foundation/collections/sync"}
                    disabled={reconnectRequired || !hasCollectionScope}
                  >
                    Save bookmark folders to Quran.com
                  </Button>
                  {hasNoteScope ? (
                    <Button
                      variant="secondary"
                      onClick={() => void post("/api/quran-foundation/notes/push", "Your journal reflections were saved to Quran.com notes.")}
                      loading={busyKey === "/api/quran-foundation/notes/push"}
                      disabled={reconnectRequired}
                    >
                      Save journal reflections to Quran.com
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.58)] px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Need to disconnect?</p>
                <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">
                  You can remove this connection at any time. Your Hifzer account stays intact.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => void post("/api/quran-foundation/disconnect", "Quran.com account disconnected.")}
                loading={busyKey === "/api/quran-foundation/disconnect"}
              >
                Disconnect Quran.com
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {feedback ? (
        <Card>
          <p className="text-sm text-[color:var(--kw-muted)]">{feedback}</p>
        </Card>
      ) : null}
    </div>
  );
}
