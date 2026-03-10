import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

export type HifzStartPoint = {
  activeSurahNumber: number;
  cursorAyahId: number;
};

export function nextStartPointIfSurahCompleted(input: HifzStartPoint): HifzStartPoint | null {
  const activeSurahNumber = Math.floor(input.activeSurahNumber);
  const cursorAyahId = Math.floor(input.cursorAyahId);
  if (!Number.isFinite(activeSurahNumber) || !Number.isFinite(cursorAyahId)) {
    return null;
  }

  const index = SURAH_INDEX.findIndex((surah) => surah.surahNumber === activeSurahNumber);
  if (index < 0) {
    return null;
  }

  const current = SURAH_INDEX[index];
  if (!current || cursorAyahId <= current.endAyahId) {
    return null;
  }

  const next = SURAH_INDEX[index + 1];
  if (!next) {
    return null;
  }

  return {
    activeSurahNumber: next.surahNumber,
    cursorAyahId: next.startAyahId,
  };
}
