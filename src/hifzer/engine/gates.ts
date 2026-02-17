import type { SrsGrade } from "@prisma/client";

export function gradeScore(grade: SrsGrade): number {
  if (grade === "AGAIN") {
    return 0;
  }
  if (grade === "HARD") {
    return 1;
  }
  if (grade === "GOOD") {
    return 2;
  }
  return 3;
}

export function isWarmupGatePassed(grades: SrsGrade[]): boolean {
  if (!grades.length) {
    return true;
  }
  const againCount = grades.filter((g) => g === "AGAIN").length;
  const avg = grades.reduce((sum, g) => sum + gradeScore(g), 0) / grades.length;
  return avg >= 2 && againCount <= 1;
}

export function weeklyGateSampleSize(input: {
  dailyMinutes: number;
  avgReviewSeconds: number;
  sabqiPoolSize: number;
}): number {
  const budgetSeconds = Math.max(60, Math.floor(input.dailyMinutes) * 60);
  const perItemSeconds = Math.max(1, Math.floor(input.avgReviewSeconds));
  const sampleCap = Math.floor((budgetSeconds / perItemSeconds) * 0.25);
  return Math.max(0, Math.min(20, Math.max(6, sampleCap), Math.max(0, input.sabqiPoolSize)));
}

