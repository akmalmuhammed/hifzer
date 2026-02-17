import { MAX_STATION, clampStation, intervalDaysForStation } from "@/hifzer/srs/intervals";
import { checkpointMinutesAt, nextCheckpointIndex } from "@/hifzer/engine/checkpoints";
import type { AyahReviewState, SrsGrade } from "@/hifzer/srs/types";

function clampEaseFactor(ef: number): number {
  if (!Number.isFinite(ef)) {
    return 2.5;
  }
  return Math.max(1.3, Math.min(3.0, ef));
}

function addMinutes(now: Date, minutes: number): Date {
  const d = new Date(now);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
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

function nextCheckpoint(current: number, grade: SrsGrade): number {
  if (grade === "AGAIN") {
    return Math.max(0, Math.floor(current) - 1);
  }
  if (grade === "EASY") {
    return nextCheckpointIndex(nextCheckpointIndex(current));
  }
  return nextCheckpointIndex(current);
}

function stationForCheckpoint(checkpointIndex: number): number {
  return clampStation(Math.min(MAX_STATION, checkpointIndex + 1));
}

export function defaultReviewState(ayahId: number, now: Date): AyahReviewState {
  const checkpointIndex = 0;
  const nextIntervalMinutes = checkpointMinutesAt(checkpointIndex);
  const station = stationForCheckpoint(checkpointIndex);
  const intervalDays = Math.max(1, Math.round(nextIntervalMinutes / (60 * 24)));
  return {
    ayahId,
    station,
    checkpointIndex,
    nextIntervalMinutes,
    intervalDays,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    nextReviewAt: addMinutes(now, nextIntervalMinutes),
    lastReviewAt: undefined,
    lastGrade: undefined,
  };
}

export function applyGrade(
  state: AyahReviewState,
  grade: SrsGrade,
  now: Date,
  durationSec?: number,
): AyahReviewState {
  const checkpointIndex = nextCheckpoint(state.checkpointIndex ?? Math.max(0, state.station - 1), grade);
  const station = stationForCheckpoint(checkpointIndex);
  const easeFactor = updateEaseFactor(state.easeFactor, grade);

  const checkpointMinutes = checkpointMinutesAt(checkpointIndex);
  const intervalDays = intervalDaysForReview(station, easeFactor, grade);
  const nextIntervalMinutes = Math.max(checkpointMinutes, intervalDays * 24 * 60);
  const nextReviewAt = addMinutes(now, nextIntervalMinutes);

  return {
    ...state,
    station,
    checkpointIndex,
    nextIntervalMinutes,
    intervalDays,
    easeFactor,
    repetitions: state.repetitions + (grade === "AGAIN" ? 0 : 1),
    lapses: state.lapses + (grade === "AGAIN" ? 1 : 0),
    lastDurationSec: Number.isFinite(durationSec) ? Math.max(0, Math.floor(durationSec ?? 0)) : state.lastDurationSec,
    lastReviewAt: now,
    lastGrade: grade,
    nextReviewAt,
  };
}
