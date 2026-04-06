"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BookOpenText, Clock3, Headphones } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";

const STORAGE_KEY = "hifzer_quran_reading_plan_v1";
const AYAHS_PER_PAGE = 20;
const DAILY_MINUTES_OPTIONS = [5, 10, 20] as const;
const TRACK_OPTIONS = [
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "365d", label: "1 year", days: 365 },
  { id: "steady", label: "Steady", days: null },
] as const;

type TrackId = (typeof TRACK_OPTIONS)[number]["id"];

type ReadingPlanCardProps = {
  totalAyahs: number;
  completedAyahCount: number;
  continueHref: string;
  anonymousHref: string;
};

function formatFutureDate(days: number): string {
  const now = new Date();
  const target = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  return target.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function loadSavedPlan(): { trackId: TrackId; minutes: number; customMinutes: string } {
  if (typeof window === "undefined") {
    return { trackId: "90d", minutes: 10, customMinutes: "15" };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { trackId: "90d", minutes: 10, customMinutes: "15" };
    }
    const parsed = JSON.parse(raw) as { trackId?: TrackId; minutes?: number };
    const trackId = parsed.trackId ?? "90d";
    if (typeof parsed.minutes === "number" && Number.isFinite(parsed.minutes)) {
      if (DAILY_MINUTES_OPTIONS.includes(parsed.minutes as (typeof DAILY_MINUTES_OPTIONS)[number])) {
        return { trackId, minutes: parsed.minutes, customMinutes: "15" };
      }
      return { trackId, minutes: -1, customMinutes: String(parsed.minutes) };
    }
    return { trackId, minutes: 10, customMinutes: "15" };
  } catch {
    return { trackId: "90d", minutes: 10, customMinutes: "15" };
  }
}

export function QuranReadingPlanCard(props: ReadingPlanCardProps) {
  const { pushToast } = useToast();
  const [savedPlan] = useState(loadSavedPlan);
  const [trackId, setTrackId] = useState<TrackId>(savedPlan.trackId);
  const [minutes, setMinutes] = useState(savedPlan.minutes);
  const [customMinutes, setCustomMinutes] = useState(savedPlan.customMinutes);

  const remainingAyahs = Math.max(0, props.totalAyahs - props.completedAyahCount);
  const track = TRACK_OPTIONS.find((option) => option.id === trackId) ?? TRACK_OPTIONS[1];
  const resolvedMinutes = minutes === -1 ? Math.max(5, Math.min(90, Math.floor(Number(customMinutes) || 15))) : minutes;

  const computed = useMemo(() => {
    if (track.days == null) {
      const ayahsPerDay = Math.max(12, Math.round(resolvedMinutes * 4.5));
      const pagesPerDay = Math.max(1, Math.ceil(ayahsPerDay / AYAHS_PER_PAGE));
      const daysToFinish = remainingAyahs > 0 ? Math.ceil(remainingAyahs / ayahsPerDay) : 0;
      return { ayahsPerDay, pagesPerDay, daysToFinish };
    }
    const ayahsPerDay = Math.max(1, Math.ceil(remainingAyahs / track.days));
    const pagesPerDay = Math.max(1, Math.ceil(ayahsPerDay / AYAHS_PER_PAGE));
    const daysToFinish = remainingAyahs > 0 ? track.days : 0;
    return { ayahsPerDay, pagesPerDay, daysToFinish };
  }, [remainingAyahs, resolvedMinutes, track.days]);

  function saveOnDevice() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          trackId,
          minutes: resolvedMinutes,
        }),
      );
      pushToast({
        tone: "success",
        title: "Plan saved",
        message: "Your reading target is saved on this device.",
      });
    } catch {
      pushToast({
        tone: "warning",
        title: "Save failed",
        message: "This browser blocked local saving. The plan still works for this session.",
      });
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[rgba(var(--kw-accent-rgb),0.12)] blur-2xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Daily reading plan</Pill>
              <Pill tone="neutral">{remainingAyahs} ayahs left</Pill>
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              Build a simple khatmah rhythm.
            </h3>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Pick your pace once, then keep the same calm daily loop: read, listen, and continue from where you stopped.
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            <BookOpenText size={18} />
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.9fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Completion track</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRACK_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTrackId(option.id)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    trackId === option.id
                      ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] hover:bg-white",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Daily time budget</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {DAILY_MINUTES_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMinutes(option)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    minutes === option
                      ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] hover:bg-white",
                  ].join(" ")}
                >
                  {option} min
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMinutes(-1)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  minutes === -1
                    ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                    : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] hover:bg-white",
                ].join(" ")}
              >
                Custom
              </button>
              {minutes === -1 ? (
                <Input
                  type="number"
                  min={5}
                  max={90}
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  aria-label="Custom daily time budget in minutes"
                  className="h-9 w-24"
                />
              ) : null}
            </div>
          </div>

          <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/75 p-4 shadow-[var(--kw-shadow-soft)]">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-[color:var(--kw-faint)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Today&apos;s target</p>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              {computed.ayahsPerDay} ayahs / day
            </p>
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
              Roughly {computed.pagesPerDay} page{computed.pagesPerDay === 1 ? "" : "s"} daily at {resolvedMinutes} minutes.
            </p>
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
              {computed.daysToFinish > 0 ? `Projected finish: ${formatFutureDate(computed.daysToFinish)}` : "You have already completed a full khatmah track."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={props.continueHref}>
                <Button className="gap-2">
                  Read now <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href={props.anonymousHref}>
                <Button variant="secondary" className="gap-2">
                  Listen privately <Headphones size={16} />
                </Button>
              </Link>
            </div>
            <div className="mt-4">
              <Button variant="ghost" className="px-0 text-sm" onClick={saveOnDevice}>
                Save this plan on this device
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
