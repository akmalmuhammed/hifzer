"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpenText, CalendarDays, PlayCircle, RefreshCcw, Target } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { buildTodayQueue, missedDaysSince, modeForMissedDays } from "@/hifzer/srs/queue";
import { formatModeLabel, getActiveSurahNumber, getCursorAyahId, getLastCompletedLocalDate, getOpenSession, listDueReviews, todayIsoLocalDate } from "@/hifzer/local/store";
import { getSurahInfo } from "@/hifzer/quran/lookup";

export function TodayClient() {
  const [snapshot, setSnapshot] = useState(() => {
    const now = new Date();
    const today = todayIsoLocalDate(now);
    const activeSurahNumber = getActiveSurahNumber();
    const cursorAyahId = getCursorAyahId();
    const open = getOpenSession();
    const due = listDueReviews(now);
    const last = getLastCompletedLocalDate();
    return {
      now,
      today,
      activeSurahNumber,
      cursorAyahId,
      open,
      due,
      lastCompletedLocalDate: last,
    };
  });

  const openForToday = snapshot.open && snapshot.open.status === "OPEN" && snapshot.open.localDate === snapshot.today;
  const surah = snapshot.activeSurahNumber ? getSurahInfo(snapshot.activeSurahNumber) : null;
  const surahComplete = Boolean(surah && snapshot.cursorAyahId && snapshot.cursorAyahId > surah.endAyahId);

  const cursorText = useMemo(() => {
    if (!surah || !snapshot.cursorAyahId) {
      return null;
    }
    const pos = snapshot.cursorAyahId - surah.startAyahId + 1;
    if (pos > surah.ayahCount) {
      return `Complete (${surah.ayahCount}/${surah.ayahCount})`;
    }
    if (pos < 1) {
      return `Before start (ayahId ${snapshot.cursorAyahId})`;
    }
    return `Ayah ${pos} / ${surah.ayahCount}`;
  }, [snapshot.cursorAyahId, surah]);

  const queue = useMemo(() => {
    if (!snapshot.activeSurahNumber || !snapshot.cursorAyahId) {
      return null;
    }
    return buildTodayQueue(
      {
        activeSurahNumber: snapshot.activeSurahNumber,
        cursorAyahId: snapshot.cursorAyahId,
        lastCompletedLocalDate: snapshot.lastCompletedLocalDate,
      },
      snapshot.due,
      snapshot.now,
    );
  }, [snapshot.activeSurahNumber, snapshot.cursorAyahId, snapshot.due, snapshot.lastCompletedLocalDate, snapshot.now]);

  const modeSummary = useMemo(() => {
    const missedDays = missedDaysSince(snapshot.lastCompletedLocalDate, snapshot.today);
    const mode = modeForMissedDays(missedDays);
    return { missedDays, mode, label: formatModeLabel(mode) };
  }, [snapshot.lastCompletedLocalDate, snapshot.today]);

  const newCount =
    queue && queue.newStartAyahId && queue.newEndAyahId ? queue.newEndAyahId - queue.newStartAyahId + 1 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Home"
        title="Today"
        subtitle="A calm plan: review what is due, then advance your cursor in small, sustainable steps."
        right={
          <div className="flex items-center gap-2">
            <Link href="/session">
              <Button className="gap-2">
                {openForToday ? "Resume session" : "Start session"} <PlayCircle size={16} />
              </Button>
            </Link>
            <Link href="/quran">
              <Button variant="secondary" className="gap-2">
                Browse Qur&apos;an <BookOpenText size={16} />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Active surah
              </p>
              {surah ? (
                <>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">
                    <span dir="rtl">{surah.nameArabic}</span>
                    <span className="ml-2 text-sm font-semibold text-[color:var(--kw-muted)]">
                      {surah.nameTransliteration}
                    </span>
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                    Cursor: <span className="font-semibold text-[color:var(--kw-ink)]">{cursorText}</span>
                  </p>
                  {surahComplete ? (
                    <div className="mt-4 rounded-[18px] border border-[rgba(234,88,12,0.26)] bg-[rgba(234,88,12,0.10)] px-3 py-3 text-sm text-[color:var(--kw-ember-600)]">
                      <p className="font-semibold text-[color:var(--kw-ember-600)]">Surah complete.</p>
                      <p className="mt-1 text-sm text-[color:rgba(194,65,12,0.88)]">
                        Choose the next surah to continue.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">
                    Choose a starting point
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                    Pick any surah and the ayah you want to begin from. You can change it later.
                  </p>
                </>
              )}
            </div>

            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <Target size={18} />
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href="/onboarding/start-point">
              <Button variant="secondary" className="gap-2">
                {surahComplete ? "Choose next surah" : surah ? "Change surah" : "Choose start point"}{" "}
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/settings/display">
              <Button variant="ghost" className="gap-2">
                Display <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Today plan
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">
                {modeSummary.label}
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                {modeSummary.missedDays ? (
                  <>
                    Missed days:{" "}
                    <span className="font-semibold text-[color:var(--kw-ink)]">{modeSummary.missedDays}</span>.
                    The plan adapts to protect retention.
                  </>
                ) : (
                  <>On track. Small daily sessions compound.</>
                )}
              </p>
            </div>

            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <CalendarDays size={18} />
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Warmup
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {queue ? queue.warmupIds.length : "--"}
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Due
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {snapshot.due.length}
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                New
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {queue ? newCount : "--"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {queue ? <Pill tone="neutral">Mode: {formatModeLabel(queue.mode)}</Pill> : null}
              {openForToday ? <Pill tone="accent">Open session</Pill> : <Pill tone="neutral">No open session</Pill>}
            </div>
            <Link href="/session">
              <Button className="gap-2">
                {openForToday ? "Resume" : "Start"} <PlayCircle size={16} />
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-[color:var(--kw-faint)]">
            Prototype note: data is stored locally. Once Clerk + Prisma land, your schedule follows you
            across devices.
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Quick checks
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              If you changed your start point in another tab, reload this page to refresh the local snapshot.
            </p>
          </div>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => {
              const now = new Date();
              const today = todayIsoLocalDate(now);
              const activeSurahNumber = getActiveSurahNumber();
              const cursorAyahId = getCursorAyahId();
              const open = getOpenSession();
              const due = listDueReviews(now);
              const last = getLastCompletedLocalDate();
              setSnapshot({
                now,
                today,
                activeSurahNumber,
                cursorAyahId,
                open,
                due,
                lastCompletedLocalDate: last,
              });
            }}
          >
            Reload <RefreshCcw size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
