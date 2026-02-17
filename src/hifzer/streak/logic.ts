import { addIsoDaysUtc, isoDateToUtcMidnightMs } from "@/hifzer/derived/dates";

export const MIN_QUALIFIED_SECONDS_PER_DAY = 300;
export const STREAK_CALENDAR_DAYS = 84;

export type SecondsByLocalDate = Record<string, number>;

export type StreakCalendarDay = {
  date: string;
  qualified: boolean;
  qualifiedSeconds: number;
  qualifiedMinutes: number;
  eligible: boolean;
};

export type StreakChainSummary = {
  currentStreakDays: number;
  bestStreakDays: number;
  graceInUseToday: boolean;
  lastQualifiedDate: string | null;
};

function dayDiff(fromIso: string, toIso: string): number {
  const from = isoDateToUtcMidnightMs(fromIso);
  const to = isoDateToUtcMidnightMs(toIso);
  if (from == null || to == null) {
    return 0;
  }
  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
}

function normalizeDateKeys(input: SecondsByLocalDate): string[] {
  return Object.keys(input).filter((key) => isoDateToUtcMidnightMs(key) != null).sort();
}

export function aggregateSecondsByLocalDate(rows: Array<{ localDate: string; durationSec: number }>): SecondsByLocalDate {
  const out: SecondsByLocalDate = {};
  for (const row of rows) {
    if (!row.localDate || isoDateToUtcMidnightMs(row.localDate) == null) {
      continue;
    }
    const sec = Math.max(0, Math.floor(Number(row.durationSec) || 0));
    if (sec <= 0) {
      continue;
    }
    out[row.localDate] = (out[row.localDate] ?? 0) + sec;
  }
  return out;
}

export function buildCalendar84d(input: {
  todayLocalDate: string;
  startLocalDate: string;
  secondsByDate: SecondsByLocalDate;
  minQualifiedSecondsPerDay?: number;
}): StreakCalendarDay[] {
  const minQualified = input.minQualifiedSecondsPerDay ?? MIN_QUALIFIED_SECONDS_PER_DAY;
  const out: StreakCalendarDay[] = [];
  for (let delta = -(STREAK_CALENDAR_DAYS - 1); delta <= 0; delta += 1) {
    const date = addIsoDaysUtc(input.todayLocalDate, delta);
    const eligible = date >= input.startLocalDate;
    const qualifiedSeconds = eligible ? Math.max(0, input.secondsByDate[date] ?? 0) : 0;
    out.push({
      date,
      eligible,
      qualifiedSeconds,
      qualifiedMinutes: Math.floor(qualifiedSeconds / 60),
      qualified: eligible && qualifiedSeconds >= minQualified,
    });
  }
  return out;
}

export function computeChainSummary(input: {
  qualifiedDates: string[];
  todayLocalDate: string;
}): StreakChainSummary {
  if (!input.qualifiedDates.length) {
    return {
      currentStreakDays: 0,
      bestStreakDays: 0,
      graceInUseToday: false,
      lastQualifiedDate: null,
    };
  }

  let best = 1;
  let currentChainLen = 1;
  let lastChainLen = 1;
  for (let idx = 1; idx < input.qualifiedDates.length; idx += 1) {
    const prev = input.qualifiedDates[idx - 1]!;
    const current = input.qualifiedDates[idx]!;
    if (dayDiff(prev, current) <= 2) {
      currentChainLen += 1;
    } else {
      currentChainLen = 1;
    }
    if (currentChainLen > best) {
      best = currentChainLen;
    }
    lastChainLen = currentChainLen;
  }

  const lastQualifiedDate = input.qualifiedDates[input.qualifiedDates.length - 1] ?? null;
  const yesterday = addIsoDaysUtc(input.todayLocalDate, -1);
  const qualifiesForCurrent = lastQualifiedDate === input.todayLocalDate || lastQualifiedDate === yesterday;
  const currentStreakDays = qualifiesForCurrent ? lastChainLen : 0;
  const qualifiedSet = new Set(input.qualifiedDates);
  const graceInUseToday = !qualifiedSet.has(input.todayLocalDate) && qualifiedSet.has(yesterday) && currentStreakDays > 0;

  return {
    currentStreakDays,
    bestStreakDays: best,
    graceInUseToday,
    lastQualifiedDate,
  };
}

export function deriveQualifiedDates(input: {
  secondsByDate: SecondsByLocalDate;
  startLocalDate: string;
  todayLocalDate: string;
  minQualifiedSecondsPerDay?: number;
}): string[] {
  const minQualified = input.minQualifiedSecondsPerDay ?? MIN_QUALIFIED_SECONDS_PER_DAY;
  const keys = normalizeDateKeys(input.secondsByDate);
  return keys.filter((date) => {
    if (date < input.startLocalDate || date > input.todayLocalDate) {
      return false;
    }
    return (input.secondsByDate[date] ?? 0) >= minQualified;
  });
}
