export const EARLY_CHECKPOINT_MINUTES = [240, 480, 1440, 4320, 10080, 20160, 43200, 129600] as const;

export function checkpointMinutesAt(index: number): number {
  if (!Number.isFinite(index) || index <= 0) {
    return EARLY_CHECKPOINT_MINUTES[0];
  }
  const i = Math.max(0, Math.min(EARLY_CHECKPOINT_MINUTES.length - 1, Math.floor(index)));
  return EARLY_CHECKPOINT_MINUTES[i] ?? EARLY_CHECKPOINT_MINUTES[0];
}

export function nextCheckpointIndex(current: number): number {
  const i = Math.max(0, Math.floor(current));
  return Math.min(EARLY_CHECKPOINT_MINUTES.length - 1, i + 1);
}

