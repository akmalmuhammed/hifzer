"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { ArrowRight, Search } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { STORAGE_KEYS } from "@/hifzer/local/store";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

const LEGACY_STORAGE_KEYS = {
  activeSurahNumber: "hifzer_active_surah_number_v1",
  cursorAyahId: "hifzer_cursor_ayah_id_v1",
} as const;

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function OnboardingStartPointClient(props: {
  initialSurahNumber: number;
  initialCursorAyahId: number;
}) {
  const router = useRouter();
  const { pushToast } = useToast();

  const initialSurah = SURAH_INDEX.find((s) => s.surahNumber === props.initialSurahNumber) ?? SURAH_INDEX[0]!;
  const [query, setQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState(initialSurah.surahNumber);
  const [ayahNumber, setAyahNumber] = useState(() => {
    const cursor = props.initialCursorAyahId;
    if (!cursor) {
      return 1;
    }
    return Math.max(1, Math.min(initialSurah.ayahCount, cursor - initialSurah.startAyahId + 1));
  });
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => SURAH_INDEX.find((s) => s.surahNumber === selectedSurah) ?? SURAH_INDEX[0]!,
    [selectedSurah],
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) {
      return SURAH_INDEX;
    }
    return SURAH_INDEX.filter((s) => {
      const hay = `${s.surahNumber} ${s.nameArabic} ${s.nameTransliteration} ${s.nameEnglish}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const clampedAyah = Math.max(1, Math.min(selected.ayahCount, Math.floor(ayahNumber || 1)));
  const cursorAyahId = selected.startAyahId + (clampedAyah - 1);

  async function saveAndNext() {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/start-point", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          surahNumber: selected.surahNumber,
          ayahNumber: clampedAyah,
          cursorAyahId,
          source: "onboarding",
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to sync starting point.");
      }

      window.localStorage.setItem(STORAGE_KEYS.hifzActiveSurahNumber, String(selected.surahNumber));
      window.localStorage.setItem(STORAGE_KEYS.hifzCursorAyahId, String(cursorAyahId));
      window.localStorage.removeItem(LEGACY_STORAGE_KEYS.activeSurahNumber);
      window.localStorage.removeItem(LEGACY_STORAGE_KEYS.cursorAyahId);
      pushToast({
        title: "Starting point saved",
        message: `You will begin at Surah ${selected.surahNumber}:${clampedAyah}.`,
        tone: "success",
      });
      router.push("/onboarding/complete");
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          area: "onboarding",
          step: "start-point",
          action: "save_start_point",
        },
        extra: {
          surahNumber: selected.surahNumber,
          ayahNumber: clampedAyah,
          cursorAyahId,
        },
      });
      pushToast({
        title: "Could not save starting point",
        message: error instanceof Error ? error.message : "Please try again so your dashboard opens at the right ayah.",
        tone: "warning",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      step="start-point"
      title="Choose where to begin."
      subtitle="Pick the surah and ayah you want Hifzer to anchor from. This is the last setup step before the dashboard opens."
      backHref="/onboarding/assessment"
      headerAction={(
        <Button asChild variant="secondary" size="sm" className="gap-2">
          <Link href="/quran-preview">Browse Qur&apos;an</Link>
        </Button>
      )}
      supportTitle="One last choice, then you are in"
      supportBody="We only need your starting place so the app opens with the right context instead of a generic default."
      supportPoints={[
        {
          title: "Choose any surah",
          description: "Search by number, Arabic, transliteration, or English name until you find the right place.",
        },
        {
          title: "Pick the ayah",
          description: "Set the exact ayah you want to begin from so Hifzer opens at the right place.",
        },
        {
          title: "Easy to change later",
          description: "If your routine changes, you can move this cursor again from inside the product.",
        },
      ]}
    >
      <Card className="p-6! shadow-none! sm:p-7!">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Pill tone="accent">Selected start</Pill>
            <p className="mt-3 text-[1.6rem] font-semibold leading-[1.3] tracking-[-0.022em] text-[color:var(--kw-ink)]">
              <span className="mr-2 text-[color:var(--kw-faint)]">Surah {selected.surahNumber}</span>
              <span dir="rtl" lang="ar">{selected.nameArabic}</span>
            </p>
            <p className="mt-1 text-[0.94rem] text-[color:var(--kw-muted)]">
              {selected.nameTransliteration} - {selected.nameEnglish} - {selected.revelationType}
            </p>
          </div>

          <div className="w-full max-w-sm">
            <label
              htmlFor="onboarding-start-ayah"
              className="text-[0.94rem] font-semibold text-[color:var(--kw-ink)]"
            >
              Starting ayah
            </label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="onboarding-start-ayah"
                type="number"
                min={1}
                max={selected.ayahCount}
                value={clampedAyah}
                onChange={(e) => setAyahNumber(Number(e.target.value))}
              />
              <span className="shrink-0 whitespace-nowrap text-[0.94rem] font-medium tabular-nums text-[color:var(--kw-muted)]">
                / {selected.ayahCount}
              </span>
            </div>
            <p className="mt-2 text-[0.84rem] text-[color:var(--kw-faint)]">
              Your reading will resume from this exact ayah.
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-[12px] bg-[color:var(--kw-fill-strong)] px-3.5 py-0.5">
          <label className="sr-only" htmlFor="onboarding-surah-search">
            Search surahs
          </label>
          <div className="flex items-center gap-2">
            <Search size={16} className="text-[color:var(--kw-faint)]" />
            <input
              id="onboarding-surah-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search surah by number or name..."
              className="h-10 w-full rounded-[8px] bg-transparent text-[0.94rem] text-[color:var(--kw-ink)] outline-none placeholder:text-[color:var(--kw-faint)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.16)]"
            />
          </div>
        </div>

        <div className="mt-3 grid max-h-[46vh] gap-1 overflow-auto pr-1">
          {filtered.map((s) => {
            const active = s.surahNumber === selectedSurah;
            return (
              <button
                key={s.surahNumber}
                type="button"
                onClick={() => {
                  setSelectedSurah(s.surahNumber);
                  setAyahNumber(1);
                }}
                className={[
                  "rounded-[14px] px-4 py-3 text-left transition-colors duration-200",
                  active
                    ? "bg-[rgba(var(--kw-accent-rgb),0.1)]"
                    : "bg-transparent hover:bg-[color:var(--kw-fill)]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.84rem] font-medium tabular-nums text-[color:var(--kw-faint)]">
                      Surah {s.surahNumber} - {s.ayahCount} ayahs
                    </p>
                    <p className="mt-1 text-[1.25rem] font-semibold leading-[1.4] text-[color:var(--kw-ink)]">
                      <span dir="rtl" lang="ar">{s.nameArabic}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[0.94rem] text-[color:var(--kw-muted)]">
                      {s.nameTransliteration} - {s.nameEnglish}
                    </p>
                  </div>
                  {active ? <Pill tone="accent">Selected</Pill> : <Pill tone="neutral">Pick</Pill>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--kw-border-2)] pt-6">
          <p className="text-[0.84rem] text-[color:var(--kw-faint)]">
            You can change this later from the dashboard once onboarding is complete.
          </p>
          <Button onClick={saveAndNext} className="min-w-[11rem] gap-2" loading={saving}>
            Finish setup <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </OnboardingShell>
  );
}
