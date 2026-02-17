"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

const STORAGE_KEYS = {
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
  const [selectedSurah, setSelectedSurah] = useState(() => readStoredNumber(STORAGE_KEYS.activeSurahNumber) ?? 1);
  const [ayahNumber, setAyahNumber] = useState(() => {
    const selected = SURAH_INDEX.find((s) => s.surahNumber === (readStoredNumber(STORAGE_KEYS.activeSurahNumber) ?? 1));
    const cursor = readStoredNumber(STORAGE_KEYS.cursorAyahId);
    if (!selected || !cursor) {
      return 1;
    }
    return Math.max(1, Math.min(selected.ayahCount, cursor - selected.startAyahId + 1));
  });

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
    window.localStorage.setItem(STORAGE_KEYS.activeSurahNumber, String(selected.surahNumber));
    window.localStorage.setItem(STORAGE_KEYS.cursorAyahId, String(cursorAyahId));

    try {
      await fetch("/api/profile/start-point", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          surahNumber: selected.surahNumber,
          ayahNumber: clampedAyah,
          cursorAyahId,
        }),
      });
    } catch {
      // Local state remains the source of truth if backend sync is unavailable.
    }

    pushToast({
      title: "Starting point saved",
      message: `Surah ${selected.surahNumber}:${clampedAyah} (ayahId ${cursorAyahId})`,
      tone: "success",
    });
    router.push("/onboarding/plan-preview");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Start point"
        subtitle="Choose any surah, then choose the ayah you want to start from."
        right={
          <Link href="/quran-preview" className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
            Browse Qur&apos;an
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Pill tone="neutral">Selected</Pill>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              <span className="mr-2 text-[color:var(--kw-faint)]">Surah {selected.surahNumber}</span>
              <span dir="rtl">{selected.nameArabic}</span>
            </p>
            <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
              {selected.nameTransliteration} - {selected.nameEnglish} - {selected.revelationType}
            </p>
          </div>

          <div className="w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Starting ayah
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Input
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
          <div className="flex items-center gap-2">
            <Search size={16} className="text-[color:var(--kw-faint)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search surah by number or name..."
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--kw-faint)]"
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
            You can change this later from Today once onboarding is complete.
          </p>
          <Button onClick={saveAndNext} className="gap-2">
            Continue <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
