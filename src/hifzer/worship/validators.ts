import {
  FASTING_KINDS,
  FASTING_STATUSES,
  PRAYER_CHECK_IN_STATUSES,
  PRAYER_NAMES,
  ZAKAT_PLAN_STATUSES,
  type FastingKind,
  type FastingStatus,
  type PrayerCheckInStatus,
  type PrayerName,
  type ZakatPlanStatus,
} from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONEY = /^(0|[1-9]\d{0,14})(?:\.(\d{1,2}))?$/;
const MUTATION_ID = /^[A-Za-z0-9_-]{16,128}$/;

function includes<T extends readonly string[]>(values: T, input: unknown): input is T[number] {
  return typeof input === "string" && values.includes(input);
}

export function normalizePrayerName(input: unknown): PrayerName | null {
  return includes(PRAYER_NAMES, input) ? input : null;
}

export function normalizePrayerStatus(input: unknown): PrayerCheckInStatus | null {
  return includes(PRAYER_CHECK_IN_STATUSES, input) ? input : null;
}

export function normalizeFastingStatus(input: unknown): FastingStatus | null {
  return includes(FASTING_STATUSES, input) ? input : null;
}

export function normalizeFastingKind(input: unknown): FastingKind | null {
  return includes(FASTING_KINDS, input) ? input : null;
}

export function normalizeZakatPlanStatus(input: unknown): ZakatPlanStatus | null {
  return includes(ZAKAT_PLAN_STATUSES, input) ? input : null;
}

export function normalizeExpectedVersion(input: unknown): number | null {
  const version = Number(input);
  return Number.isSafeInteger(version) && version >= 1 ? version : null;
}

export function normalizeClientMutationId(input: unknown): string | null {
  return typeof input === "string" && MUTATION_ID.test(input) ? input : null;
}

export function normalizeIsoDate(input: unknown): string | null {
  if (typeof input !== "string" || !ISO_DATE.test(input)) {
    return null;
  }
  const parsed = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== input ? null : input;
}

export function normalizeCurrency(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }
  const value = input.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(value) ? value : null;
}

export function parseMoneyToMinor(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }
  const value = input.trim();
  const match = MONEY.exec(value);
  if (!match) {
    return null;
  }
  const whole = match[1] ?? "0";
  const fraction = (match[2] ?? "").padEnd(2, "0");
  const minor = `${whole}${fraction}`.replace(/^0+(?=\d)/, "");
  return minor || "0";
}
