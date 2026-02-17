import type { SrsMode } from "@prisma/client";

type ModeInput = {
  debtRatioPct: number;
  missedDays: number;
  retention3dAvg: number;
  consolidationThresholdPct: number;
  catchUpThresholdPct: number;
};

function safeThreshold(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return value;
}

export function resolveMode(input: ModeInput): SrsMode {
  const consolidation = safeThreshold(input.consolidationThresholdPct, 25);
  const catchUp = safeThreshold(input.catchUpThresholdPct, 45);

  if (input.debtRatioPct >= catchUp || input.missedDays >= 3) {
    return "CATCH_UP";
  }

  if (
    input.debtRatioPct >= consolidation ||
    input.missedDays === 2 ||
    input.retention3dAvg < 1.8
  ) {
    return "CONSOLIDATION";
  }

  return "NORMAL";
}

