"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { ReaderBookmarkControl } from "@/components/bookmarks/reader-bookmark-control";
import { Card } from "@/components/ui/card";
import type { ReaderUiCopy } from "@/hifzer/quran/reader-ui-copy";
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
  showPhonetic: boolean;
  showTranslation: boolean;
  ui: ReaderUiCopy;
  translationDir: "ltr" | "rtl";
  translationAlignClass: string;
  compactReaderAnchor: string;
  syncEnabled: boolean;
  reciterId: string;
};

export function CompactReaderClient({
  ayahs,
  initialAyahId,
  totalInSet,
  indexInSet,
  nextSurahHref,
  anonymous,
  showPhonetic,
  showTranslation,
  ui,
  translationDir,
  translationAlignClass,
  compactReaderAnchor,
  syncEnabled,
  reciterId,
}: Props) {
  const router = useRouter();
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
  const currentId = current?.id;

  // Sync the URL cursor param without triggering a navigation / re-render.
  useEffect(() => {
    if (currentId == null) return;
    const url = new URL(window.location.href);
    url.searchParams.set("cursor", String(currentId));
    window.history.replaceState(null, "", url.toString());
  }, [currentId]);

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

  function buildNextSurahHrefFromCurrent(): string | null {
    if (current.surahNumber >= 114) {
      return null;
    }
    const params = new URLSearchParams();
    params.set("view", "compact");
    params.set("surah", String(current.surahNumber + 1));
    params.set("phonetic", showPhonetic ? "1" : "0");
    params.set("translation", showTranslation ? "1" : "0");
    if (anonymous) {
      params.set("anon", "1");
    }
    return `/quran/read?${params.toString()}#${compactReaderAnchor}`;
  }

  const resolvedNextSurahHref = buildNextSurahHrefFromCurrent() ?? nextSurahHref;

  function handleAutoAdvance() {
    if (nextAyah) {
      handleNext();
      return;
    }
    if (resolvedNextSurahHref) {
      router.push(resolvedNextSurahHref, { scroll: false });
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
  const showAnyDetails = showPhonetic || showTranslation;

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
              reciterId={reciterId}
              className="w-full sm:w-auto"
              streakTrackSource={anonymous ? undefined : "quran_browse"}
              autoPlayPrefKey="hifzer_quran_autoplay_v1"
              onAutoAdvance={handleAutoAdvance}
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
        {showAnyDetails ? (
          <div className="mt-3 space-y-2">
            {showPhonetic ? (
              <p dir="ltr" className="text-sm leading-7 text-[color:var(--kw-faint)]">
                {current.phonetic ?? ui.phoneticUnavailable}
              </p>
            ) : null}
            {showTranslation ? (
              <p
                dir={translationDir}
                className={`text-sm leading-7 text-[color:var(--kw-muted)] ${translationAlignClass}`}
              >
                {current.translation ?? ui.translationUnavailable}
              </p>
            ) : null}
          </div>
        ) : (
          <p dir={translationDir} className="mt-3 text-sm leading-7 text-[color:var(--kw-faint)]">
            {ui.detailsHiddenInFilters}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center gap-2">
          {prevAyah ? (
            <button type="button" onClick={handlePrev} className={btnSecondary}>
              {ui.previous}
            </button>
          ) : (
            <span className={btnDisabled}>{ui.previous}</span>
          )}

          {nextAyah ? (
            <button type="button" onClick={handleNext} className={btnActive}>
              {ui.next}
            </button>
          ) : resolvedNextSurahHref ? (
            <Link href={resolvedNextSurahHref} scroll={false} className={btnActive}>
              {ui.nextSurah}
            </Link>
          ) : (
            <span className={btnDisabled}>{ui.nextSurah}</span>
          )}
        </div>
      </Card>
    </div>
  );
}
