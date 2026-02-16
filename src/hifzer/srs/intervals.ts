export const MAX_STATION = 7;
export const MIN_STATION = 1;

// 7-station schedule (days). MVP derives intervalDays primarily from this table.
export const STATION_INTERVAL_DAYS: Readonly<Record<number, number>> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
  6: 30,
  7: 90,
} as const;

export function clampStation(station: number): number {
  if (!Number.isFinite(station)) {
    return MIN_STATION;
  }
  return Math.max(MIN_STATION, Math.min(MAX_STATION, Math.floor(station)));
}

export function intervalDaysForStation(station: number): number {
  const s = clampStation(station);
  return STATION_INTERVAL_DAYS[s] ?? 1;
}

