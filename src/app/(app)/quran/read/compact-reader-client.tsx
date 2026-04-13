"use client";

import { useEffect, useRef, useState, type MouseEvent, type TouchEvent, type WheelEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { ReaderBookmarkControl } from "@/components/bookmarks/reader-bookmark-control";
import { JournalPrefillLink } from "@/components/journal/journal-prefill-link";
import { AyahAiExplanationPanel } from "@/components/quran/ayah-ai-explanation-panel";
import { QuranAiAssistantPanel } from "@/components/quran/quran-ai-assistant-panel";
import { SupportTextPanel } from "@/components/quran/support-text-panel";
import { Card } from "@/components/ui/card";
import type { ReaderUiCopy } from "@/hifzer/quran/reader-ui-copy";
import { CompactOfficialTafsir, type InitialCompactOfficialTafsir } from "./compact-official-tafsir";
import { ReadProgressSync, type ReadProgressSyncHandle } from "./read-progress-sync";

const QURAN_AUDIO_SPEED_PREF_KEY = "hifzer_quran_audio_speed_v1";
const QURAN_ARABIC_SCALE_KEY = "hifzer_quran_arabic_scale_v1";
const MIN_ARABIC_SCALE = 0.8;
const MAX_ARABIC_SCALE = 1.75;

function clampArabicScale(value: number): number {
  return Math.max(MIN_ARABIC_SCALE, Math.min(MAX_ARABIC_SCALE, value));
}

function readStoredArabicScale(): number {
  if (typeof window === "undefined") {
    return 1;
  }
  try {
    const raw = window.localStorage.getItem(QURAN_ARABIC_SCALE_KEY);
    if (!raw) {
      return 1;
    }
    return clampArabicScale(Number(raw));
  } catch {
    return 1;
  }
}

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
  showTafsir: boolean;
  selectedTafsirId: number | null;
  selectedTafsirLabel: string | null;
  initialOfficialTafsir: InitialCompactOfficialTafsir | null;
  ui: ReaderUiCopy;
  translationDir: "ltr" | "rtl";
  translationAlignClass: string;
  compactReaderAnchor: string;
  syncEnabled: boolean;
  reciterId: string;
  focusMode: boolean;
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
  showTafsir,
  selectedTafsirId,
  selectedTafsirLabel,
  initialOfficialTafsir,
  ui,
  translationDir,
  translationAlignClass,
  compactReaderAnchor,
  syncEnabled,
  reciterId,
  focusMode,
}: Props) {
  const router = useRouter();
  const progressSyncRef = useRef<ReadProgressSyncHandle | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);
  const [cursorIndex, setCursorIndex] = useState(() => {
    const idx = ayahs.findIndex((a) => a.id === initialAyahId);
    return idx >= 0 ? idx : 0;
  });
  const [arabicScale, setArabicScale] = useState(readStoredArabicScale);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(QURAN_ARABIC_SCALE_KEY, String(arabicScale));
    } catch {
      // ignore storage write failures
    }
  }, [arabicScale]);

  if (!current) return null;

  function resizeArabic(delta: number) {
    setArabicScale((previous) => clampArabicScale(previous + delta));
  }

  function advanceToIndex(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(ayahs.length - 1, nextIndex));
    if (boundedIndex === cursorIndex) {
      return;
    }

    const nextAyah = ayahs[boundedIndex];
    progressSyncRef.current?.markAyahVisited({
      surahNumber: nextAyah.surahNumber,
      ayahNumber: nextAyah.ayahNumber,
      ayahId: nextAyah.id,
    });
    setCursorIndex(boundedIndex);
    const delta = boundedIndex - cursorIndex;
    const nextGlobal = globalIndexRef.current + delta;
    globalIndexRef.current = nextGlobal;
    setGlobalIndex(nextGlobal);
  }

  function handlePrev() {
    if (cursorIndex > 0) {
      advanceToIndex(cursorIndex - 1);
    }
  }

  function handleNext() {
    if (cursorIndex < ayahs.length - 1) {
      advanceToIndex(cursorIndex + 1);
    }
  }

  function advanceToNextVisible() {
    if (nextAyah) {
      advanceToIndex(cursorIndex + 1);
      return;
    }
    if (resolvedNextSurahHref) {
      router.push(resolvedNextSurahHref, { scroll: false });
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
    params.set("tafsir", showTafsir ? "1" : "0");
    if (selectedTafsirId != null) {
      params.set("tafsirId", String(selectedTafsirId));
    }
    if (anonymous) {
      params.set("anon", "1");
    }
    return `/quran/read?${params.toString()}#${compactReaderAnchor}`;
  }

  const resolvedNextSurahHref = buildNextSurahHrefFromCurrent() ?? nextSurahHref;

  function handleAutoAdvance() {
    advanceToNextVisible();
  }

  function onFocusTextClick(event: MouseEvent<HTMLDivElement>) {
    if (!focusMode) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
    if (relativeX <= 0.35 && prevAyah) {
      handlePrev();
      return;
    }
    if (relativeX >= 0.65) {
      advanceToNextVisible();
    }
  }

  function onArabicTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length >= 2) {
      const [first, second] = Array.from(event.touches);
      pinchDistanceRef.current = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
    }
  }

  function onArabicTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchDistanceRef.current = null;
      return;
    }
    const [first, second] = Array.from(event.touches);
    const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
    if (pinchDistanceRef.current != null) {
      event.preventDefault();
      const delta = (distance - pinchDistanceRef.current) / 240;
      if (Math.abs(delta) > 0.01) {
        setArabicScale((previous) => clampArabicScale(previous + delta));
      }
    }
    pinchDistanceRef.current = distance;
  }

  function onArabicTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchDistanceRef.current = null;
    }
  }

  function onArabicWheel(event: WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.06 : 0.06;
    resizeArabic(delta);
  }

  const arabicFontSize = `clamp(${(1.8 * arabicScale).toFixed(2)}rem, ${(5 * arabicScale).toFixed(2)}vw, ${(2.7 * arabicScale).toFixed(2)}rem)`;

  const btnBase =
    "rounded-xl border px-3 py-2 text-sm font-semibold";
  const btnActive =
    `${btnBase} border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]`;
  const btnDisabled =
    `${btnBase} border-[color:var(--kw-border-2)] bg-white/50 text-[color:var(--kw-faint)]`;
  const btnSecondary =
    `${btnBase} border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]`;
  const showAnyDetails = !focusMode && (showPhonetic || showTranslation || showTafsir);

  return (
    <div id={compactReaderAnchor} className={focusMode ? "mx-auto max-w-4xl pt-2" : "mt-8"}>
      {syncEnabled && (
        <ReadProgressSync
          ref={progressSyncRef}
          enabled
          surahNumber={current.surahNumber}
          ayahNumber={current.ayahNumber}
          ayahId={current.id}
        />
      )}
      <Card className={focusMode ? "py-5 sm:px-6" : "py-3"}>
        {!focusMode ? (
          <>
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
                  speedPrefKey={QURAN_AUDIO_SPEED_PREF_KEY}
                  onAutoAdvance={handleAutoAdvance}
                  trailingControl={
                    <div className="flex items-center gap-2">
                      <JournalPrefillLink
                        ayahId={current.id}
                        label="Add this ayah to journal"
                        ariaLabel={`Add Surah ${current.surahNumber}:${current.ayahNumber} to journal`}
                        variant="icon"
                      />
                      <ReaderBookmarkControl
                        ayahId={current.id}
                        surahNumber={current.surahNumber}
                        ayahNumber={current.ayahNumber}
                        anonymous={anonymous}
                        variant="inline"
                      />
                    </div>
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                Pinch, Ctrl + wheel, or use A-/A+
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => resizeArabic(-0.08)} className={btnSecondary}>
                  A-
                </button>
                <button type="button" onClick={() => resizeArabic(0.08)} className={btnSecondary}>
                  A+
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-md">
            <AyahAudioPlayer
              ayahId={current.id}
              reciterId={reciterId}
              className="w-full"
              streakTrackSource={anonymous ? undefined : "quran_browse"}
              autoPlayPrefKey="hifzer_quran_autoplay_v1"
              speedPrefKey={QURAN_AUDIO_SPEED_PREF_KEY}
              onAutoAdvance={handleAutoAdvance}
            />
          </div>
        )}
        <div
          dir="rtl"
          className={focusMode ? "mt-8 text-right text-[color:var(--kw-ink)]" : "mt-3 text-right text-[color:var(--kw-ink)]"}
          style={{ fontSize: arabicFontSize, lineHeight: 2.05, touchAction: "manipulation" }}
          onTouchStart={onArabicTouchStart}
          onTouchMove={onArabicTouchMove}
          onTouchEnd={onArabicTouchEnd}
          onTouchCancel={onArabicTouchEnd}
          onWheel={onArabicWheel}
          onClick={onFocusTextClick}
        >
          {current.textUthmani}
        </div>

        {showAnyDetails ? (
          <div className="mt-3 space-y-2">
            {showPhonetic ? (
              <SupportTextPanel kind="transliteration">
                {current.phonetic ?? ui.phoneticUnavailable}
              </SupportTextPanel>
            ) : null}
            {showTranslation ? (
              <SupportTextPanel
                kind="translation"
                dir={translationDir}
                alignClassName={translationAlignClass}
              >
                {current.translation ?? ui.translationUnavailable}
              </SupportTextPanel>
            ) : null}
            {showTafsir ? (
              <CompactOfficialTafsir
                key={`${current.id}:${selectedTafsirId ?? "default"}`}
                ayahId={current.id}
                tafsirId={selectedTafsirId}
                fallbackLabel={selectedTafsirLabel}
                initial={current.id === initialAyahId ? initialOfficialTafsir : null}
              />
            ) : null}
          </div>
        ) : !focusMode ? (
          <p dir={translationDir} className="mt-3 text-sm leading-7 text-[color:var(--kw-faint)]">
            {ui.detailsHiddenInFilters}
          </p>
        ) : null}

        {!focusMode ? <AyahAiExplanationPanel key={current.id} ayahId={current.id} compact /> : null}
        {!focusMode ? <QuranAiAssistantPanel key={`assistant-${current.id}`} ayahId={current.id} compact /> : null}

        {!focusMode ? (
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
        ) : null}
      </Card>
    </div>
  );
}
