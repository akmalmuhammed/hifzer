import type { SrsGrade, SrsMode } from "@prisma/client";

export type QueueLinkRepair = {
  fromAyahId: number;
  toAyahId: number;
};

export type TodayQueuePlan = {
  warmupAyahIds: number[];
  weeklyGateAyahIds: number[];
  sabqiReviewAyahIds: number[];
  manzilReviewAyahIds: number[];
  repairLinks: QueueLinkRepair[];
  newAyahIds: number[];
};

export type TodayEngineResult = {
  localDate: string;
  mode: SrsMode;
  reviewDebtMinutes: number;
  debtRatio: number;
  reviewFloorPct: number;
  retention3dAvg: number;
  weeklyGateRequired: boolean;
  monthlyTestRequired: boolean;
  warmupRequired: boolean;
  warmupRetryAllowed: boolean;
  // Mode-level unlock. Gate pass/fail is evaluated during session completion.
  newUnlocked: boolean;
  dueNowCount: number;
  dueSoonCount: number;
  nextDueAt: string | null;
  queue: TodayQueuePlan;
  meta: {
    missedDays: number;
    weekOne: boolean;
    reviewPoolSize: number;
  };
};

export type SessionStep =
  | {
    kind: "AYAH";
    stage: "WARMUP" | "REVIEW" | "NEW" | "WEEKLY_TEST" | "LINK_REPAIR";
    ayahId: number;
    phase: "STANDARD" | "NEW_EXPOSE" | "NEW_GUIDED" | "NEW_BLIND" | "WEEKLY_TEST" | "LINK_REPAIR";
    reviewTier?: "SABQI" | "MANZIL";
  }
  | { kind: "LINK"; stage: "LINK" | "LINK_REPAIR"; fromAyahId: number; toAyahId: number; phase: "STANDARD" | "LINK_REPAIR" };

export type SessionEventInput = {
  stepIndex: number;
  stage: "WARMUP" | "REVIEW" | "NEW" | "LINK" | "WEEKLY_TEST" | "LINK_REPAIR";
  phase: "STANDARD" | "NEW_EXPOSE" | "NEW_GUIDED" | "NEW_BLIND" | "WEEKLY_TEST" | "LINK_REPAIR";
  ayahId: number;
  fromAyahId?: number;
  toAyahId?: number;
  grade?: SrsGrade;
  durationSec: number;
  textVisible?: boolean;
  assisted?: boolean;
  createdAt: string;
};
