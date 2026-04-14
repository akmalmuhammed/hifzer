"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import type { QuranFoundationConnectedOverview, QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";

const ADVANCED_SYNC_SCOPES = [
  "activity_day",
  "streak.read",
  "goal.read",
  "reading_session",
  "collection",
  "note",
] as const;

function feedbackLabel(param: string | null): string | null {
  if (param === "connected") return "Quran.com account linked.";
  if (param === "oauth-failed") return "The Quran.com OAuth exchange failed.";
  if (param === "state-mismatch") return "The Quran.com OAuth state check failed.";
  if (param === "not-configured") return "Quran Foundation env vars are not configured yet.";
  if (param === "sign-in-required") return "Sign in before linking a Quran.com account.";
  return null;
}

export function QuranFoundationSettingsClient(props: {
  initialStatus: QuranFoundationConnectionStatus;
  initialOverview: QuranFoundationConnectedOverview | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const { pushToast } = useToast();
  const feedback = useMemo(() => feedbackLabel(searchParams.get("qf")), [searchParams]);

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
  const needsRelink = (status.state === "connected" || status.state === "degraded") && missingAdvancedScopes.length > 0;

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
            {needsRelink ? (
              <div className="mt-3 rounded-[18px] border border-[rgba(214,153,46,0.25)] bg-[rgba(214,153,46,0.08)] px-4 py-3 text-sm text-[color:var(--kw-muted)]">
                Reconnect Quran.com once to grant the new streak, goals, collections, reading-session, and notes permissions.
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
                {needsRelink ? (
                  <Button
                    onClick={() => {
                      window.location.href = `/api/quran-foundation/connect?returnTo=${encodeURIComponent("/settings/quran-foundation")}`;
                    }}
                  >
                    Refresh permissions
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => void post("/api/quran-foundation/bookmarks/push", "Existing bookmarks synced to Quran.com.")}
                  loading={busyKey === "/api/quran-foundation/bookmarks/push"}
                >
                  Sync local bookmarks
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void post("/api/quran-foundation/bookmarks/hydrate", "Quran.com bookmarks imported into Hifzer.")}
                  loading={busyKey === "/api/quran-foundation/bookmarks/hydrate"}
                >
                  Import Quran.com bookmarks
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void post("/api/quran-foundation/collections/sync", "Bookmark collections synced to Quran.com.")}
                  loading={busyKey === "/api/quran-foundation/collections/sync"}
                >
                  Sync bookmark collections
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void post("/api/quran-foundation/notes/hydrate", "Quran.com notes imported into your journal.")}
                  loading={busyKey === "/api/quran-foundation/notes/hydrate"}
                >
                  Import Quran.com notes
                </Button>
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
                {overview.readingSession
                  ? `Surah ${overview.readingSession.surahNumber}:${overview.readingSession.ayahNumber}`
                  : "Not synced yet"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {overview.readingSession?.updatedAt
                  ? `Updated ${new Date(overview.readingSession.updatedAt).toLocaleString()}`
                  : "Resume points can travel between Hifzer and Quran.com."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Quran.com streak</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {overview.streak ? `${overview.streak.currentDays} days` : "No streak data yet"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {overview.streak?.bestDays ? `Best so far: ${overview.streak.bestDays} days` : "Activity days keep the external streak updated."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Today&apos;s goal</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {overview.goalPlan?.title ?? "No Quran.com goal found"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {overview.goalPlan?.remaining ?? "If you set a Quran.com goal, it will appear here."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Collections</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {overview.collections ? `${overview.collections.count} remote collections` : "Not synced yet"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                Bookmark categories can export into Quran.com collections.
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Private notes</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {overview.notes ? `${overview.notes.count} Quran.com notes` : "No imported notes yet"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                Journal reflections stay private and can sync through Quran.com notes.
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
