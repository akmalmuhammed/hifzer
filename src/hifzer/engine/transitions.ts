import type { SrsGrade, WeakTransition } from "@prisma/client";

export function isTransitionSuccess(grade: SrsGrade): boolean {
  return grade === "GOOD" || grade === "EASY";
}

export function computeTransitionSuccessRate(successCount: number, attemptCount: number): number {
  if (!attemptCount) {
    return 0;
  }
  return successCount / attemptCount;
}

export function isWeakTransition(input: {
  attemptCount: number;
  successCount: number;
}): boolean {
  if (input.attemptCount < 3) {
    return false;
  }
  return computeTransitionSuccessRate(input.successCount, input.attemptCount) < 0.7;
}

export function dueRepairTransitions(transitions: WeakTransition[], now: Date): WeakTransition[] {
  return transitions
    .filter((row) => !row.nextRepairAt || row.nextRepairAt.getTime() <= now.getTime())
    .filter((row) => isWeakTransition({ attemptCount: row.attemptCount, successCount: row.successCount }))
    .sort((a, b) => (a.successRateCached - b.successRateCached) || (a.lastOccurredAt.getTime() - b.lastOccurredAt.getTime()));
}

