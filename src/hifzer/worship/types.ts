export const PRAYER_NAMES = ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

export const PRAYER_CHECK_IN_STATUSES = ["ON_TIME", "LATER", "EXCUSED"] as const;
export type PrayerCheckInStatus = (typeof PRAYER_CHECK_IN_STATUSES)[number];

export const FASTING_STATUSES = ["FASTING", "COMPLETED", "NOT_FASTING", "EXEMPT"] as const;
export type FastingStatus = (typeof FASTING_STATUSES)[number];

export const FASTING_KINDS = ["RAMADAN", "MAKE_UP", "VOLUNTARY", "OTHER"] as const;
export type FastingKind = (typeof FASTING_KINDS)[number];

export const ZAKAT_PLAN_STATUSES = ["DRAFT", "READY", "PARTIALLY_PAID", "PAID"] as const;
export type ZakatPlanStatus = (typeof ZAKAT_PLAN_STATUSES)[number];

export type PrayerCheckInSnapshot = {
  prayer: PrayerName;
  status: PrayerCheckInStatus;
  version: number;
  updatedAt: string;
};

export type FastingCheckInSnapshot = {
  status: FastingStatus;
  kind: FastingKind | null;
  version: number;
  updatedAt: string;
};

export type ZakatPaymentSnapshot = {
  id: string;
  paidOn: string;
  amountMinor: string;
  currency: string;
  createdAt: string;
};

export type ZakatPlanSnapshot = {
  id: string;
  periodYear: number;
  dueDate: string | null;
  status: ZakatPlanStatus;
  version: number;
  amountMinor: string;
  currency: string;
  payments: ZakatPaymentSnapshot[];
};

export type WorshipSnapshot = {
  today: {
    localDate: string;
    timezone: string;
  };
  prayers: PrayerCheckInSnapshot[];
  fasting: FastingCheckInSnapshot | null;
  zakat: {
    encryptionConfigured: boolean;
    plan: ZakatPlanSnapshot | null;
    unavailableReason: string | null;
  };
};
