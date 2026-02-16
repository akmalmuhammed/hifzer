"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, PlayCircle, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { getOpenSession, listArchivedSessions, setOpenSession, todayIsoLocalDateUtc } from "@/hifzer/local/store";

function newCount(session: { queue: { newStartAyahId: number | null; newEndAyahId: number | null } }): number {
  const { newStartAyahId, newEndAyahId } = session.queue;
  if (!newStartAyahId || !newEndAyahId) {
    return 0;
  }
  return Math.max(0, newEndAyahId - newStartAyahId + 1);
}

export function HistorySessionsClient() {
  const [snapshot, setSnapshot] = useState(() => {
    const now = new Date();
    const today = todayIsoLocalDateUtc(now);
    const open = getOpenSession();
    const archived = listArchivedSessions();
    return { now, today, open, archived };
  });

  const openForToday = snapshot.open && snapshot.open.status === "OPEN" && snapshot.open.localDate === snapshot.today;

  const rows = useMemo(() => {
    return snapshot.archived.map((s) => {
      const warmup = s.queue.warmupIds.length;
      const review = s.queue.reviewIds.length;
      const sabaq = newCount(s);
      const started = new Date(s.startedAt).toLocaleString();
      const ended = s.endedAt ? new Date(s.endedAt).toLocaleString() : null;
      return { s, warmup, review, sabaq, started, ended };
    });
  }, [snapshot.archived]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="History"
        title="Session history"
        subtitle="Local-first history with Prisma sync support when auth + database are active."
        right={
          <div className="flex items-center gap-2">
            <Link href="/session">
              <Button className="gap-2">
                {openForToday ? "Resume" : "Start"} <PlayCircle size={16} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => {
                window.localStorage.removeItem("hifzer_sessions_v1");
                setSnapshot((s) => ({ ...s, archived: [] }));
              }}
              title="Clear local session history"
            >
              Clear <Trash2 size={16} />
            </Button>
          </div>
        }
      />

      {openForToday ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <Pill tone="accent">Open</Pill>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                You have an open session for today. Resume to continue where you left off.
              </p>
            </div>
            <Link href="/session">
              <Button className="gap-2">
                Resume session <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}

      {rows.length ? (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.s.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={r.s.status === "COMPLETED" ? "brand" : "neutral"}>{r.s.status}</Pill>
                    <Pill tone="neutral">{r.s.localDate}</Pill>
                    <Pill tone="neutral">Mode: {r.s.queue.mode}</Pill>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
                    Warmup <span className="font-semibold text-[color:var(--kw-ink)]">{r.warmup}</span>, Review{" "}
                    <span className="font-semibold text-[color:var(--kw-ink)]">{r.review}</span>, New{" "}
                    <span className="font-semibold text-[color:var(--kw-ink)]">{r.sabaq}</span>
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                    Started: {r.started}
                    {r.ended ? ` | Ended: ${r.ended}` : ""}
                  </p>
                </div>

                {r.s.status === "OPEN" ? (
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => {
                      setOpenSession(r.s);
                      setSnapshot((s) => ({ ...s, open: r.s }));
                    }}
                  >
                    Set as open <Clock size={16} />
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No sessions yet"
            message="Start a session to create your first history entry."
            icon={<Clock size={18} />}
            action={
              <Link href="/session">
                <Button className="gap-2">
                  Start session <PlayCircle size={16} />
                </Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  );
}
