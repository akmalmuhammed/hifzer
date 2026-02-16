import { MAX_STATION, clampStation, intervalDaysForStation } from "@/hifzer/srs/intervals";
import type { AyahReviewState, SrsGrade } from "@/hifzer/srs/types";

function clampEaseFactor(ef: number): number {
  if (!Number.isFinite(ef)) {
    return 2.5;
  }
  return Math.max(1.3, Math.min(3.0, ef));
}

function addDays(now: Date, days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d;
}

function nextStation(current: number, grade: SrsGrade): number {
  const s = clampStation(current);
  if (grade === "AGAIN") {
    return clampStation(s - 1);
  }
  if (grade === "HARD") {
    return clampStation(s);
  }
  if (grade === "EASY") {
    return clampStation(s + 2);
  }
  return clampStation(s + 1);
}

function updateEaseFactor(current: number, grade: SrsGrade): number {
  const ef = clampEaseFactor(current);
  if (grade === "AGAIN") {
    return clampEaseFactor(ef - 0.2);
  }
  if (grade === "HARD") {
    return clampEaseFactor(ef - 0.15);
  }
  if (grade === "EASY") {
    return clampEaseFactor(ef + 0.15);
  }
  return clampEaseFactor(ef + 0.05);
}

function intervalDaysForReview(station: number, easeFactor: number, grade: SrsGrade): number {
  if (grade === "AGAIN") {
    return 1;
  }

  const baseInterval = intervalDaysForStation(station);
  if (station >= MAX_STATION) {
    return baseInterval;
  }

  // Keep the 7-station schedule as the baseline and use EF as a bounded nudge.
  const multiplier = Math.max(0.8, Math.min(1.25, easeFactor / 2.5));
  return Math.max(1, Math.round(baseInterval * multiplier));
}

export function defaultReviewState(ayahId: number, now: Date): AyahReviewState {
  const station = 1;
  const intervalDays = intervalDaysForStation(station);
  return {
    ayahId,
    station,
    intervalDays,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    nextReviewAt: addDays(now, intervalDays),
    lastReviewAt: undefined,
    lastGrade: undefined,
  };
}

export function applyGrade(state: AyahReviewState, grade: SrsGrade, now: Date): AyahReviewState {
  const station = nextStation(state.station, grade);
  const easeFactor = updateEaseFactor(state.easeFactor, grade);

  const intervalDays = intervalDaysForReview(station, easeFactor, grade);
  const nextReviewAt = addDays(now, intervalDays);

  return {
    ...state,
    station,
    intervalDays,
    easeFactor,
    repetitions: state.repetitions + (grade === "AGAIN" ? 0 : 1),
    lapses: state.lapses + (grade === "AGAIN" ? 1 : 0),
    lastReviewAt: now,
    lastGrade: grade,
    nextReviewAt,
  };
}
