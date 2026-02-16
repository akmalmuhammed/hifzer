"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, CalendarClock, PlayCircle, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { DonutProgress } from "@/components/charts/donut-progress";
import { HeatStrip } from "@/components/charts/heat-strip";
import { StackedBars } from "@/components/charts/stacked-bars";
import {
  getActiveSurahNumber,
  getCursorAyahId,
  listAllReviews,
  listAttempts,
  listDueReviews,
  todayIsoLocalDateUtc,
} from "@/hifzer/local/store";
import { buildActivityDays } from "@/hifzer/derived/activity";
import { addIsoDaysUtc } from "@/hifzer/derived/dates";
import { countGrades } from "@/hifzer/derived/grades";
import { averageStation, countStations } from "@/hifzer/derived/stations";
import { getSurahInfo } from "@/hifzer/quran/lookup";

export function ProgressClient() {
  const [snapshot] = useState(() => {
    const now = new Date();
    const today = todayIsoLocalDateUtc(now);
    const attempts = listAttempts();
    const reviews = listAllReviews();
    const due = listDueReviews(now);
    const activeSurahNumber = getActiveSurahNumber();
    const cursorAyahId = getCursorAyahId();
    return { now, today, attempts, reviews, due, activeSurahNumber, cursorAyahId };
  });

  const activity = useMemo(
    () => buildActivityDays(snapshot.attempts, snapshot.today, 42),
    [snapshot.attempts, snapshot.today],
  );

  const gradeCounts = useMemo(() => {
    const since = addIsoDaysUtc(snapshot.today, -6);
    return countGrades(snapshot.attempts, since);
  }, [snapshot.attempts, snapshot.today]);

  const gradeSegments = useMemo(
    () => [
      { label: "Again", value: gradeCounts.AGAIN, color: "rgba(234,88,12,0.80)" },
      { label: "Hard", value: gradeCounts.HARD, color: "rgba(2,132,199,0.78)" },
      { label: "Good", value: gradeCounts.GOOD, color: "rgba(10,138,119,0.82)" },
      { label: "Easy", value: gradeCounts.EASY, color: "rgba(31,54,217,0.78)" },
    ],
    [gradeCounts.AGAIN, gradeCounts.EASY, gradeCounts.GOOD, gradeCounts.HARD],
  );

  const stationCounts = useMemo(() => countStations(snapshot.reviews), [snapshot.reviews]);
  const avgStation = useMemo(() => averageStation(snapshot.reviews), [snapshot.reviews]);

  const activeSurah = useMemo(
    () => (snapshot.activeSurahNumber ? getSurahInfo(snapshot.activeSurahNumber) : null),
    [snapshot.activeSurahNumber],
  );

  const surahProgress = useMemo(() => {
    if (!activeSurah || !snapshot.cursorAyahId) {
      return null;
    }
    const raw = (snapshot.cursorAyahId - activeSurah.startAyahId) / Math.max(1, activeSurah.ayahCount);
    return Math.max(0, Math.min(1, raw));
  }, [activeSurah, snapshot.cursorAyahId]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Progress"
        subtitle="A snapshot of your activity, grades, and spaced repetition state."
        right={
          <div className="flex items-center gap-2">
            <Link href="/session">
              <Button className="gap-2">
                Practice <PlayCircle size={16} />
              </Button>
            </Link>
            <Link href="/settings/plan">
              <Button variant="secondary" className="gap-2">
                Adjust plan <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Tracked ayahs
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {snapshot.reviews.length}
          </p>
          <p className="mt-2 text-xs text-[color:var(--kw-muted)]">Ayahs with SRS state.</p>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Due now
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {snapshot.due.length}
          </p>
          <p className="mt-2 text-xs text-[color:var(--kw-muted)]">Ready for review.</p>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Avg station
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {avgStation ? avgStation.toFixed(1) : "0.0"}
          </p>
          <p className="mt-2 text-xs text-[color:var(--kw-muted)]">1 to 7 schedule.</p>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Active surah
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">
                {activeSurah ? activeSurah.nameTransliteration : "Not set"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                {surahProgress != null ? `${Math.round(surahProgress * 100)}% cursor progress` : "Choose a start point"}
              </p>
            </div>
            {surahProgress != null ? <DonutProgress value={surahProgress} tone="accent" /> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Activity
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                Attempts per day (last 6 weeks).
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <CalendarClock size={18} />
            </span>
          </div>

          <div className="mt-5">
            <HeatStrip days={activity} tone="accent" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Grade mix
              </p>
              <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                Last 7 days.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <BarChart3 size={18} />
            </span>
          </div>

          <div className="mt-5">
            <StackedBars
              segments={gradeSegments}
              height={18}
              ariaLabel="Grade mix"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-[color:var(--kw-muted)]">
            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2">
              <p className="font-semibold text-[color:var(--kw-ink)]">Again</p>
              <p className="mt-1">{gradeCounts.AGAIN}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2">
              <p className="font-semibold text-[color:var(--kw-ink)]">Hard</p>
              <p className="mt-1">{gradeCounts.HARD}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2">
              <p className="font-semibold text-[color:var(--kw-ink)]">Good</p>
              <p className="mt-1">{gradeCounts.GOOD}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2">
              <p className="font-semibold text-[color:var(--kw-ink)]">Easy</p>
              <p className="mt-1">{gradeCounts.EASY}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <Pill tone="neutral">SRS state</Pill>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              Stations represent review intervals. This is the backbone that prevents the &quot;confidence slider&quot; dead end.
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            <Sparkles size={18} />
          </span>
        </div>

        <div className="mt-6 grid gap-2 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((station) => (
            <div
              key={station}
              className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Station {station}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {stationCounts[station] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
