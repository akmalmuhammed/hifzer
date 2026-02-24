"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { ReaderBookmarkControl } from "@/components/bookmarks/reader-bookmark-control";
import { Card } from "@/components/ui/card";
import { ReadProgressSync } from "./read-progress-sync";

export type CompactAyahData = {
  id: number;
  surahNumber: number;
  ayahNumber: number;
  textUthmani: string;
  phonetic: string | null;
  translation: string | null;
};

type Props = {
  ayahs: CompactAyahData[];
  initialAyahId: number;
  totalInSet: number; // total ayahs in the filtered set (for "X / N" display)
  indexInSet: number; // 0-based index of initialAyahId within the full filtered set
  nextSurahHref: string | null;
  anonymous: boolean;
  showDetails: boolean;
  translationDir: "ltr" | "rtl";
  translationAlignClass: string;
  compactReaderAnchor: string;
  syncEnabled: boolean;
};

export function CompactReaderClient({
  ayahs,
  initialAyahId,
  totalInSet,
  indexInSet,
  nextSurahHref,
  anonymous,
  showDetails,
  translationDir,
  translationAlignClass,
  compactReaderAnchor,
  syncEnabled,
}: Props) {
  const [cursorIndex, setCursorIndex] = useState(() => {
    const idx = ayahs.findIndex((a) => a.id === initialAyahId);
    return idx >= 0 ? idx : 0;
  });

  // Track the "global" position across the full filtered set so the counter stays accurate.
  const globalIndexRef = useRef(indexInSet);
  const [globalIndex, setGlobalIndex] = useState(indexInSet);

  const current = ayahs[cursorIndex];
  const prevAyah = cursorIndex > 0 ? ayahs[cursorIndex - 1] : null;
  const nextAyah = cursorIndex < ayahs.length - 1 ? ayahs[cursorIndex + 1] : null;

  // Sync the URL cursor param without triggering a navigation / re-render.
  useEffect(() => {
    if (!current) return;
    const url = new URL(window.location.href);
    url.searchParams.set("cursor", String(current.id));
    window.history.replaceState(null, "", url.toString());
  }, [current?.id]);

  if (!current) return null;

  function handlePrev() {
    if (cursorIndex > 0) {
      setCursorIndex((i) => i - 1);
      const next = globalIndexRef.current - 1;
      globalIndexRef.current = next;
      setGlobalIndex(next);
    }
  }

  function handleNext() {
    if (cursorIndex < ayahs.length - 1) {
      setCursorIndex((i) => i + 1);
      const next = globalIndexRef.current + 1;
      globalIndexRef.current = next;
      setGlobalIndex(next);
    }
  }

  const btnBase =
    "rounded-xl border px-3 py-2 text-sm font-semibold";
  const btnActive =
    `${btnBase} border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]`;
  const btnDisabled =
    `${btnBase} border-[color:var(--kw-border-2)] bg-white/50 text-[color:var(--kw-faint)]`;
  const btnSecondary =
    `${btnBase} border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]`;

  return (
    <div id={compactReaderAnchor} className="mt-8">
      {syncEnabled && (
        <ReadProgressSync
          enabled
          surahNumber={current.surahNumber}
          ayahNumber={current.ayahNumber}
          ayahId={current.id}
        />
      )}
      <Card className="py-3">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2.5 py-1 text-xs font-semibold text-[color:var(--kw-muted)]">
              {current.surahNumber}:{current.ayahNumber}
            </span>
            <span className="text-xs text-[color:var(--kw-faint)]">#{current.id}</span>
            <span className="text-xs text-[color:var(--kw-faint)]">
              {globalIndex + 1} / {totalInSet}
            </span>
          </div>
          <div className="w-full sm:w-auto">
            <AyahAudioPlayer
              ayahId={current.id}
              className="w-full sm:w-auto"
              streakTrackSource={anonymous ? undefined : "quran_browse"}
              autoPlayPrefKey={anonymous ? undefined : "hifzer_quran_autoplay_v1"}
              trailingControl={
                <ReaderBookmarkControl
                  ayahId={current.id}
                  surahNumber={current.surahNumber}
                  ayahNumber={current.ayahNumber}
                  anonymous={anonymous}
                  variant="inline"
                />
              }
            />
          </div>
        </div>

        {/* Arabic text */}
        <div dir="rtl" className="mt-4 text-right text-2xl leading-[2.1] text-[color:var(--kw-ink)]">
          {current.textUthmani}
        </div>

        {/* Details */}
        {showDetails ? (
          <div className="mt-3 space-y-2">
            <p dir="ltr" className="text-sm leading-7 text-[color:var(--kw-faint)]">
              {current.phonetic ?? "Phonetic unavailable"}
            </p>
            <p
              dir={translationDir}
              className={`text-sm leading-7 text-[color:var(--kw-muted)] ${translationAlignClass}`}
            >
              {current.translation ?? "Translation unavailable"}
            </p>
          </div>
        ) : (
          <p dir="ltr" className="mt-3 text-sm leading-7 text-[color:var(--kw-faint)]">
            Reader details are hidden for your account.
          </p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center gap-2">
          {prevAyah ? (
            <button type="button" onClick={handlePrev} className={btnSecondary}>
              Previous
            </button>
          ) : (
            <span className={btnDisabled}>Previous</span>
          )}

          {nextAyah ? (
            <button type="button" onClick={handleNext} className={btnActive}>
              Next
            </button>
          ) : nextSurahHref ? (
            <Link href={nextSurahHref} scroll={false} className={btnActive}>
              Next Surah
            </Link>
          ) : (
            <span className={btnDisabled}>Next</span>
          )}
        </div>
      </Card>
    </div>
  );
}
