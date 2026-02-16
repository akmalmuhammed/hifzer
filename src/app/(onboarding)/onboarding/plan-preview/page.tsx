"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

const STORAGE_KEYS = {
  activeSurahNumber: "hifzer_active_surah_number_v1",
  cursorAyahId: "hifzer_cursor_ayah_id_v1",
} as const;

export default function PlanPreviewPage() {
  const [activeSurahNumber] = useState<number | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const s = window.localStorage.getItem(STORAGE_KEYS.activeSurahNumber);
    return s ? Number(s) : null;
  });
  const [cursorAyahId] = useState<number | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const a = window.localStorage.getItem(STORAGE_KEYS.cursorAyahId);
    return a ? Number(a) : null;
  });

  const surah = useMemo(
    () => (activeSurahNumber ? SURAH_INDEX.find((x) => x.surahNumber === activeSurahNumber) : null),
    [activeSurahNumber],
  );

  const week = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      return {
        iso,
        warmup: i === 0 ? 2 : 1,
        review: 8 + i,
        sabaqNew: 5,
      };
    });
    return days;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Plan preview"
        subtitle="A 7-day preview. This is a placeholder plan that will be replaced by the SRS engine."
        right={
          <Link href="/onboarding/permissions">
            <Button variant="secondary" className="gap-2">
              Continue <ArrowRight size={16} />
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Pill tone="neutral">Starting point</Pill>
            <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
              {surah ? (
                <>
                  Surah {surah.surahNumber} - {surah.nameTransliteration} - cursor ayahId{" "}
                  <span className="font-semibold text-[color:var(--kw-ink)]">{cursorAyahId ?? "--"}</span>
                </>
              ) : (
                <>Not selected yet. Go back and choose a start point.</>
              )}
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            <CalendarDays size={18} />
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {week.map((d) => (
            <div
              key={d.iso}
              className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                {d.iso}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[color:var(--kw-muted)] sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Warmup
                  </p>
                  <p className="mt-1 font-semibold text-[color:var(--kw-ink)]">{d.warmup}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Review
                  </p>
                  <p className="mt-1 font-semibold text-[color:var(--kw-ink)]">{d.review}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Sabaq
                  </p>
                  <p className="mt-1 font-semibold text-[color:var(--kw-ink)]">{d.sabaqNew}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-[color:var(--kw-faint)]">
          Next: permissions UI scaffold. Microphone and notifications will be integrated later.
        </p>
      </Card>
    </div>
  );
}
