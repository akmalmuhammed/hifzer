import type { AttemptStage, GateOutcome, ReviewPhase, SrsGrade } from "@prisma/client";

function gradeScore(grade: SrsGrade): number {
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

function isRecallRelevant(input: { stage: AttemptStage; phase: ReviewPhase }): boolean {
  if (input.stage === "WARMUP" || input.stage === "REVIEW" || input.stage === "WEEKLY_TEST" || input.stage === "LINK_REPAIR") {
    return true;
  }
  if (input.stage === "NEW" && input.phase === "NEW_BLIND") {
    return true;
  }
  if (input.stage === "LINK" || input.phase === "LINK_REPAIR") {
    return true;
  }
  return false;
}

export function retention3dAverage(input: {
  events: Array<{ stage: AttemptStage; phase: ReviewPhase; grade: SrsGrade | null; createdAt: Date }>;
  now: Date;
}): number {
  const since = input.now.getTime() - (3 * 24 * 60 * 60 * 1000);
  const scores: number[] = [];
  for (const event of input.events) {
    if (!event.grade) {
      continue;
    }
    if (!isRecallRelevant({ stage: event.stage, phase: event.phase })) {
      continue;
    }
    if (event.createdAt.getTime() < since) {
      continue;
    }
    scores.push(gradeScore(event.grade));
  }
  if (!scores.length) {
    return 2;
  }
  return scores.reduce((sum, x) => sum + x, 0) / scores.length;
}

export function shouldForceMonthlyTest(input: { debtRatio: number; retention3dAvg: number }): boolean {
  return input.debtRatio >= 60 || input.retention3dAvg < 1.6;
}

export function moderateRebalanceProfilePatch(now: Date) {
  const until = new Date(now);
  until.setDate(until.getDate() + 14);
  return {
    rebalanceUntil: until,
    reviewFloorPct: 80,
  };
}

export function monthlyGateOutcome(input: { forceMonthlyTest: boolean }): GateOutcome {
  return input.forceMonthlyTest ? "FAIL" : "REBALANCED";
}

