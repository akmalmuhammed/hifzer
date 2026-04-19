"use client";

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
  "note",
  "goal.read",
  "streak.read",
] as const;

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
        throw new Error((await response.json().catch(() => null))?.error ?? "Request failed.");
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
        title: "Quran.com request failed",
        message: error instanceof Error ? error.message : "Request failed.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  const status = props.initialStatus;
  const overview = props.initialOverview;
  const missingAdvancedScopes = ADVANCED_SYNC_SCOPES.filter((scope) => !status.scopes.includes(scope));
  const reconnectRequired = isQuranFoundationReconnectRequired(status);
  const needsRelink = (status.state === "connected" || status.state === "degraded") && missingAdvancedScopes.length > 0;
  const scopeApprovalBlocked = isQuranFoundationScopeApprovalBlocked(status, feedbackParam);
  const hasReadingSessionScope = hasQuranFoundationGrantedScope(
    status.scopes,
    "reading_session",
    "reading_session.read",
  );
  const hasStreakReadScope = hasQuranFoundationGrantedScope(status.scopes, "streak", "streak.read");
  const hasGoalReadScope = hasQuranFoundationGrantedScope(status.scopes, "goal", "goal.read");
  const hasCollectionScope = hasQuranFoundationGrantedScope(status.scopes, "collection", "collection.read");
  const hasNoteScope = hasQuranFoundationGrantedScope(status.scopes, "note", "note.read");

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={status.state === "connected" ? "accent" : status.state === "degraded" ? "warn" : "neutral"}>
                {status.state.replace("_", " ")}
              </Pill>
              {status.userApiReady ? <Pill tone="neutral">User API ready</Pill> : null}
              {status.contentApiReady ? <Pill tone="neutral">Content API ready</Pill> : <Pill tone="warn">Content API pending</Pill>}
            </div>
            <p className="mt-3 text-sm font-semibold text-[color:var(--kw-ink)]">
              {status.displayName ?? status.email ?? "Quran.com connection"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{status.detail}</p>
            {status.lastSyncedAt ? (
              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">Last synced: {new Date(status.lastSyncedAt).toLocaleString()}</p>
            ) : null}
            {reconnectRequired || needsRelink ? (
              <div className="mt-3 rounded-[18px] border border-[rgba(214,153,46,0.25)] bg-[rgba(214,153,46,0.08)] px-4 py-3 text-sm text-[color:var(--kw-muted)]">
                {reconnectRequired
                  ? "The stored Quran.com authorization is no longer valid. Reconnect once so Hifzer can refresh tokens and resume sync."
                  : scopeApprovalBlocked
                  ? "The live Quran.com OAuth client is not approved for the newer streak, goals, and notes scopes yet. Retrying authorization will keep failing until Quran Foundation enables those scopes for this client."
                  : "Reconnect Quran.com once to grant the new activity-day, reading-session, collections, notes, streak, and goal permissions."}
              </div>
            ) : null}
            {status.scopes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {status.scopes.map((scope) => (
                  <Pill key={scope} tone="neutral">{scope}</Pill>
                ))}
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
                    {reconnectRequired
                      ? "Reconnect Quran.com"
                      : scopeApprovalBlocked
                        ? "Retry authorization"
                        : "Refresh permissions"}
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => void post("/api/quran-foundation/bookmarks/push", "Existing bookmarks synced to Quran.com.")}
                  loading={busyKey === "/api/quran-foundation/bookmarks/push"}
                  disabled={reconnectRequired}
                >
                  Sync local bookmarks
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void post("/api/quran-foundation/bookmarks/hydrate", "Quran.com bookmarks imported into Hifzer.")}
                  loading={busyKey === "/api/quran-foundation/bookmarks/hydrate"}
                  disabled={reconnectRequired}
                >
                  Import Quran.com bookmarks
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void post("/api/quran-foundation/collections/sync", "Bookmark collections synced to Quran.com.")}
                  loading={busyKey === "/api/quran-foundation/collections/sync"}
                  disabled={reconnectRequired || !hasCollectionScope}
                >
                  Sync bookmark collections
                </Button>
                {hasNoteScope ? (
                  <Button
                    variant="secondary"
                    onClick={() => void post("/api/quran-foundation/notes/hydrate", "Quran.com notes imported into your journal.")}
                    loading={busyKey === "/api/quran-foundation/notes/hydrate"}
                    disabled={reconnectRequired}
                  >
                    Import Quran.com notes
                  </Button>
                ) : null}
                <Button
                  variant="danger"
                  onClick={() => void post("/api/quran-foundation/disconnect", "Quran.com account disconnected.")}
                  loading={busyKey === "/api/quran-foundation/disconnect"}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  window.location.href = `/api/quran-foundation/connect?returnTo=${encodeURIComponent("/settings/quran-foundation")}`;
                }}
              >
                Link Quran.com account
              </Button>
            )}
            <Button variant="ghost" className="gap-2" onClick={() => router.refresh()}>
              Refresh <RefreshCcw size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {overview ? (
        <Card>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Reading session</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasReadingSessionScope && overview.readingSession
                  ? `Surah ${overview.readingSession.surahNumber}:${overview.readingSession.ayahNumber}`
                  : hasReadingSessionScope
                    ? "Not synced yet"
                    : "Pending reconnect"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasReadingSessionScope && overview.readingSession?.updatedAt
                  ? `Updated ${new Date(overview.readingSession.updatedAt).toLocaleString()}`
                  : hasReadingSessionScope
                    ? "Resume points can travel between Hifzer and Quran.com."
                    : "Reconnect once to unlock reading-session sync."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Quran.com streak</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasStreakReadScope ? `${overview.streak ? `${overview.streak.currentDays} days` : "No streak data yet"}` : "Read access pending"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasStreakReadScope
                  ? overview.streak?.bestDays
                    ? `Best so far: ${overview.streak.bestDays} days`
                    : "Activity days keep the external streak updated."
                  : "Quran.com has not approved streak readback for this client yet."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Today&apos;s goal</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasGoalReadScope ? overview.goalPlan?.title ?? "No Quran.com goal found" : "Read access pending"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasGoalReadScope
                  ? overview.goalPlan?.remaining ?? "If you set a Quran.com goal, it will appear here."
                  : "Quran.com has not approved goal readback for this client yet."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Collections</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasCollectionScope
                  ? overview.collections
                    ? `${overview.collections.count} remote collections`
                    : "Not synced yet"
                  : "Pending reconnect"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasCollectionScope
                  ? "Bookmark categories can export into Quran.com collections."
                  : "Reconnect once to unlock collection sync."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Private notes</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {hasNoteScope
                  ? overview.notes
                    ? `${overview.notes.count} Quran.com notes`
                    : "No imported notes yet"
                  : "Pending approval"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {hasNoteScope
                  ? "Journal reflections stay private and can sync through Quran.com notes."
                  : "Quran.com notes are not approved for this client yet."}
              </p>
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
