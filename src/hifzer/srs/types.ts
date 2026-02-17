export type SrsGrade = "AGAIN" | "HARD" | "GOOD" | "EASY";

export type SrsMode = "NORMAL" | "CONSOLIDATION" | "CATCH_UP";

export type AyahReviewState = {
  ayahId: number;
  station: number; // 1..7
  checkpointIndex: number;
  nextIntervalMinutes: number;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  lastDurationSec?: number;
  nextReviewAt: Date;
  lastReviewAt?: Date;
  lastGrade?: SrsGrade;
};

export type TodayQueue = {
  mode: SrsMode;
  warmupIds: number[];
  reviewIds: number[];
  newStartAyahId: number | null;
  newEndAyahId: number | null;
};
