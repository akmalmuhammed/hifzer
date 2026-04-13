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

function readStoredNumber(key: string): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export default function OnboardingStartPointPage() {
  const router = useRouter();
  const { pushToast } = useToast();

  const [query, setQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState(() =>
    readStoredNumber(STORAGE_KEYS.hifzActiveSurahNumber) ??
    readStoredNumber(LEGACY_STORAGE_KEYS.activeSurahNumber) ??
    1,
  );
  const [ayahNumber, setAyahNumber] = useState(() => {
    const selected = SURAH_INDEX.find((s) => s.surahNumber === (
      readStoredNumber(STORAGE_KEYS.hifzActiveSurahNumber) ??
      readStoredNumber(LEGACY_STORAGE_KEYS.activeSurahNumber) ??
      1
    ));
    const cursor =
      readStoredNumber(STORAGE_KEYS.hifzCursorAyahId) ??
      readStoredNumber(LEGACY_STORAGE_KEYS.cursorAyahId);
    if (!selected || !cursor) {
      return 1;
    }
    return Math.max(1, Math.min(selected.ayahCount, cursor - selected.startAyahId + 1));
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
      window.localStorage.setItem(STORAGE_KEYS.hifzActiveSurahNumber, String(selected.surahNumber));
      window.localStorage.setItem(STORAGE_KEYS.hifzCursorAyahId, String(cursorAyahId));
      window.localStorage.removeItem(LEGACY_STORAGE_KEYS.activeSurahNumber);
      window.localStorage.removeItem(LEGACY_STORAGE_KEYS.cursorAyahId);

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
        if (!res.ok) {
          throw new Error("Failed to sync starting point.");
        }
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
          title: "Starting point saved locally",
          message: "We’ll keep your place and retry the profile sync as you finish onboarding.",
          tone: "warning",
        });
      }

      pushToast({
        title: "Starting point saved",
        message: `Surah ${selected.surahNumber}:${clampedAyah} (ayahId ${cursorAyahId})`,
        tone: "success",
      });
      router.push("/onboarding/complete");
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
          description: "Set the exact ayah you want to begin from and we translate it into the correct global ayah id.",
        },
        {
          title: "Easy to change later",
          description: "If your routine changes, you can move this cursor again from inside the product.",
        },
      ]}
    >
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Pill tone="accent">Selected start</Pill>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              <span className="mr-2 text-[color:var(--kw-faint)]">Surah {selected.surahNumber}</span>
              <span dir="rtl">{selected.nameArabic}</span>
            </p>
            <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
              {selected.nameTransliteration} - {selected.nameEnglish} - {selected.revelationType}
            </p>
          </div>

          <div className="w-full max-w-sm">
            <label
              htmlFor="onboarding-start-ayah"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]"
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
              <span className="text-sm font-semibold text-[color:var(--kw-muted)]">
                / {selected.ayahCount}
              </span>
            </div>
            <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
              Global ayahId: <span className="font-semibold text-[color:var(--kw-ink)]">{cursorAyahId}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
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
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--kw-faint)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(var(--kw-accent-rgb),0.16)]"
            />
          </div>
        </div>

        <div className="mt-4 grid max-h-[46vh] gap-3 overflow-auto pr-1 md:grid-cols-2">
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
                  "rounded-[22px] border px-4 py-3 text-left shadow-[var(--kw-shadow-soft)] transition",
                  active
                    ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.08)]"
                    : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                      Surah {s.surahNumber} - {s.ayahCount} ayahs
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">
                      <span dir="rtl">{s.nameArabic}</span>
                    </p>
                    <p className="mt-1 truncate text-sm text-[color:var(--kw-muted)]">
                      {s.nameTransliteration} - {s.nameEnglish}
                    </p>
                  </div>
                  {active ? <Pill tone="accent">Selected</Pill> : <Pill tone="neutral">Pick</Pill>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[color:var(--kw-faint)]">
            You can change this later from the dashboard once onboarding is complete.
          </p>
          <Button onClick={saveAndNext} className="gap-2" loading={saving}>
            Finish setup <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </OnboardingShell>
  );
}
