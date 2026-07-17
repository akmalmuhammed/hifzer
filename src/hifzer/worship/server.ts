import "server-only";

import type {
  FastingKind as PrismaFastingKind,
  FastingStatus as PrismaFastingStatus,
  PrayerCheckInStatus as PrismaPrayerCheckInStatus,
  PrayerName as PrismaPrayerName,
  ZakatPlanStatus as PrismaZakatPlanStatus,
} from "@prisma/client";
import { isoDateInTimeZone } from "@/hifzer/engine/date";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import {
  decryptPrivateJson,
  encryptPrivateJson,
  privateDataEncryptionConfigured,
} from "@/hifzer/private-data/crypto";
import { db, dbConfigured } from "@/lib/db";
import type {
  FastingCheckInSnapshot,
  FastingKind,
  FastingStatus,
  PrayerCheckInSnapshot,
  PrayerCheckInStatus,
  PrayerName,
  WorshipSnapshot,
  ZakatPlanSnapshot,
  ZakatPlanStatus,
} from "./types";

type PrivateZakatPlan = {
  amountMinor: string;
  currency: string;
};

type PrivateZakatPayment = {
  amountMinor: string;
  currency: string;
};

const PRIVATE_ZAKAT_ENCRYPTION_VERSION = 1;

export class WorshipStorageError extends Error {
  constructor(
    public readonly code: "UNAVAILABLE" | "CONFLICT" | "NOT_FOUND" | "PRIVATE_STORAGE_UNAVAILABLE" | "INVALID_PRIVATE_DATA" | "INVALID_INPUT",
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "WorshipStorageError";
  }
}

export function isWorshipStorageError(error: unknown): error is WorshipStorageError {
  return error instanceof WorshipStorageError;
}

function planEncryptionContext(userId: string, periodYear: number): string {
  return `hifzer:zakat-plan:${userId}:${periodYear}`;
}

function paymentEncryptionContext(userId: string, planId: string, clientMutationId: string): string {
  return `hifzer:zakat-payment:${userId}:${planId}:${clientMutationId}`;
}

function isPositiveMinor(amountMinor: string): boolean {
  try {
    return BigInt(amountMinor) > BigInt(0);
  } catch {
    return false;
  }
}

function normalizePrivatePlan(input: unknown): PrivateZakatPlan {
  if (!input || typeof input !== "object") {
    throw new WorshipStorageError("INVALID_PRIVATE_DATA", 503, "Private Zakat data could not be opened.");
  }
  const value = input as Partial<PrivateZakatPlan>;
  if (
    typeof value.amountMinor !== "string" ||
    !/^\d+$/.test(value.amountMinor) ||
    !isPositiveMinor(value.amountMinor) ||
    typeof value.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency)
  ) {
    throw new WorshipStorageError("INVALID_PRIVATE_DATA", 503, "Private Zakat data could not be opened.");
  }
  return { amountMinor: value.amountMinor, currency: value.currency };
}

function normalizePrivatePayment(input: unknown): PrivateZakatPayment {
  return normalizePrivatePlan(input);
}

function toPrayerSnapshot(row: {
  prayer: PrismaPrayerName;
  status: PrismaPrayerCheckInStatus;
  version: number;
  updatedAt: Date;
}): PrayerCheckInSnapshot {
  return {
    prayer: row.prayer as PrayerName,
    status: row.status as PrayerCheckInStatus,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFastingSnapshot(row: {
  status: PrismaFastingStatus;
  kind: PrismaFastingKind | null;
  version: number;
  updatedAt: Date;
}): FastingCheckInSnapshot {
  return {
    status: row.status as FastingStatus,
    kind: row.kind ? (row.kind as FastingKind) : null,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function requireProfile(clerkUserId: string) {
  if (!dbConfigured()) {
    throw new WorshipStorageError("UNAVAILABLE", 503, "Private worship storage is not configured.");
  }
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    throw new WorshipStorageError("UNAVAILABLE", 503, "Private worship storage is not available yet.");
  }
  return profile;
}

function currentYear(localDate: string): number {
  return Number(localDate.slice(0, 4));
}

function decryptPlan(userId: string, plan: {
  periodYear: number;
  secretCiphertext: string;
  encryptionVersion: number;
}): PrivateZakatPlan {
  if (plan.encryptionVersion !== PRIVATE_ZAKAT_ENCRYPTION_VERSION) {
    throw new WorshipStorageError("INVALID_PRIVATE_DATA", 503, "Private Zakat data could not be opened.");
  }
  try {
    return normalizePrivatePlan(
      decryptPrivateJson<unknown>(plan.secretCiphertext, planEncryptionContext(userId, plan.periodYear)),
    );
  } catch (error) {
    if (error instanceof WorshipStorageError) {
      throw error;
    }
    throw new WorshipStorageError("INVALID_PRIVATE_DATA", 503, "Private Zakat data could not be opened.");
  }
}

function decryptPayment(userId: string, payment: {
  zakatPlanId: string;
  clientMutationId: string;
  secretCiphertext: string;
  encryptionVersion: number;
}): PrivateZakatPayment {
  if (payment.encryptionVersion !== PRIVATE_ZAKAT_ENCRYPTION_VERSION) {
    throw new WorshipStorageError("INVALID_PRIVATE_DATA", 503, "Private Zakat data could not be opened.");
  }
  try {
    return normalizePrivatePayment(
      decryptPrivateJson<unknown>(
        payment.secretCiphertext,
        paymentEncryptionContext(userId, payment.zakatPlanId, payment.clientMutationId),
      ),
    );
  } catch {
    throw new WorshipStorageError("INVALID_PRIVATE_DATA", 503, "Private Zakat data could not be opened.");
  }
}

async function buildZakatPlanSnapshot(userId: string, periodYear: number): Promise<{
  plan: ZakatPlanSnapshot | null;
  unavailableReason: string | null;
}> {
  if (!privateDataEncryptionConfigured()) {
    return {
      plan: null,
      unavailableReason: "Private Zakat storage is not configured yet.",
    };
  }

  const plan = await db().zakatPlan.findUnique({
    where: { userId_periodYear: { userId, periodYear } },
    include: { payments: { orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }] } },
  });
  if (!plan) {
    return { plan: null, unavailableReason: null };
  }

  try {
    const secret = decryptPlan(userId, plan);
    const payments = plan.payments.map((payment) => {
      const paymentSecret = decryptPayment(userId, payment);
      if (paymentSecret.currency !== secret.currency) {
        throw new WorshipStorageError("INVALID_PRIVATE_DATA", 503, "Private Zakat data could not be opened.");
      }
      return {
        id: payment.id,
        paidOn: payment.paidOn,
        amountMinor: paymentSecret.amountMinor,
        currency: paymentSecret.currency,
        createdAt: payment.createdAt.toISOString(),
      };
    });
    return {
      plan: {
        id: plan.id,
        periodYear: plan.periodYear,
        dueDate: plan.dueDate,
        status: plan.status as ZakatPlanStatus,
        version: plan.version,
        amountMinor: secret.amountMinor,
        currency: secret.currency,
        payments,
      },
      unavailableReason: null,
    };
  } catch (error) {
    if (error instanceof WorshipStorageError) {
      return { plan: null, unavailableReason: error.message };
    }
    return { plan: null, unavailableReason: "Private Zakat data could not be opened." };
  }
}

export async function getWorshipSnapshot(clerkUserId: string, now: Date = new Date()): Promise<WorshipSnapshot> {
  const profile = await requireProfile(clerkUserId);
  const localDate = isoDateInTimeZone(now, profile.timezone);
  const periodYear = currentYear(localDate);
  const [prayers, fasting, zakat] = await Promise.all([
    db().prayerCheckIn.findMany({
      where: { userId: profile.id, localDate },
      orderBy: { updatedAt: "asc" },
    }),
    db().fastingCheckIn.findUnique({
      where: { userId_localDate: { userId: profile.id, localDate } },
    }),
    buildZakatPlanSnapshot(profile.id, periodYear),
  ]);

  return {
    today: { localDate, timezone: profile.timezone },
    prayers: prayers.map(toPrayerSnapshot),
    fasting: fasting ? toFastingSnapshot(fasting) : null,
    zakat: {
      encryptionConfigured: privateDataEncryptionConfigured(),
      plan: zakat.plan,
      unavailableReason: zakat.unavailableReason,
    },
  };
}

export async function savePrayerCheckIn(input: {
  clerkUserId: string;
  prayer: PrayerName;
  status: PrayerCheckInStatus | null;
  expectedVersion?: number | null;
}): Promise<WorshipSnapshot> {
  const profile = await requireProfile(input.clerkUserId);
  const localDate = isoDateInTimeZone(new Date(), profile.timezone);
  const where = {
    userId_localDate_prayer: {
      userId: profile.id,
      localDate,
      prayer: input.prayer as PrismaPrayerName,
    },
  };
  const current = await db().prayerCheckIn.findUnique({ where });

  if (input.expectedVersion != null && current?.version !== input.expectedVersion) {
    throw new WorshipStorageError("CONFLICT", 409, "This prayer was updated on another device. Refresh and try again.");
  }

  if (!input.status) {
    if (current) {
      await db().prayerCheckIn.delete({ where: { id: current.id } });
    }
    return getWorshipSnapshot(input.clerkUserId);
  }

  if (current) {
    await db().prayerCheckIn.update({
      where: { id: current.id },
      data: { status: input.status as PrismaPrayerCheckInStatus, timezone: profile.timezone, version: { increment: 1 } },
    });
  } else {
    await db().prayerCheckIn.create({
      data: {
        userId: profile.id,
        localDate,
        timezone: profile.timezone,
        prayer: input.prayer as PrismaPrayerName,
        status: input.status as PrismaPrayerCheckInStatus,
      },
    });
  }

  return getWorshipSnapshot(input.clerkUserId);
}

export async function saveFastingCheckIn(input: {
  clerkUserId: string;
  status: FastingStatus | null;
  kind: FastingKind | null;
  expectedVersion?: number | null;
}): Promise<WorshipSnapshot> {
  const profile = await requireProfile(input.clerkUserId);
  const localDate = isoDateInTimeZone(new Date(), profile.timezone);
  const where = { userId_localDate: { userId: profile.id, localDate } };
  const current = await db().fastingCheckIn.findUnique({ where });

  if (input.expectedVersion != null && current?.version !== input.expectedVersion) {
    throw new WorshipStorageError("CONFLICT", 409, "This fasting check-in was updated on another device. Refresh and try again.");
  }

  if (!input.status) {
    if (current) {
      await db().fastingCheckIn.delete({ where: { id: current.id } });
    }
    return getWorshipSnapshot(input.clerkUserId);
  }

  if (current) {
    await db().fastingCheckIn.update({
      where: { id: current.id },
      data: {
        status: input.status as PrismaFastingStatus,
        kind: input.kind as PrismaFastingKind | null,
        timezone: profile.timezone,
        version: { increment: 1 },
      },
    });
  } else {
    await db().fastingCheckIn.create({
      data: {
        userId: profile.id,
        localDate,
        timezone: profile.timezone,
        status: input.status as PrismaFastingStatus,
        kind: input.kind as PrismaFastingKind | null,
      },
    });
  }

  return getWorshipSnapshot(input.clerkUserId);
}

export async function saveZakatPlan(input: {
  clerkUserId: string;
  amountMinor: string;
  currency: string;
  dueDate: string | null;
  status: ZakatPlanStatus;
  expectedVersion?: number | null;
}): Promise<WorshipSnapshot> {
  if (!isPositiveMinor(input.amountMinor) || !/^[A-Z]{3}$/.test(input.currency)) {
    throw new WorshipStorageError("INVALID_INPUT", 400, "Enter a valid private Zakat amount and currency.");
  }
  if (!privateDataEncryptionConfigured()) {
    throw new WorshipStorageError(
      "PRIVATE_STORAGE_UNAVAILABLE",
      503,
      "Private Zakat storage is not configured yet.",
    );
  }

  const profile = await requireProfile(input.clerkUserId);
  const localDate = isoDateInTimeZone(new Date(), profile.timezone);
  const periodYear = currentYear(localDate);
  const current = await db().zakatPlan.findUnique({
    where: { userId_periodYear: { userId: profile.id, periodYear } },
  });

  if (input.expectedVersion != null && current?.version !== input.expectedVersion) {
    throw new WorshipStorageError("CONFLICT", 409, "This Zakat plan was updated on another device. Refresh and try again.");
  }
  if (current) {
    // Verify the existing value can be opened before any update. A changed key must
    // never silently overwrite a user's encrypted annual record.
    decryptPlan(profile.id, current);
  }

  const secretCiphertext = encryptPrivateJson(
    { amountMinor: input.amountMinor, currency: input.currency } satisfies PrivateZakatPlan,
    planEncryptionContext(profile.id, periodYear),
  );
  if (current) {
    await db().zakatPlan.update({
      where: { id: current.id },
      data: {
        dueDate: input.dueDate,
        status: input.status as PrismaZakatPlanStatus,
        secretCiphertext,
        encryptionVersion: PRIVATE_ZAKAT_ENCRYPTION_VERSION,
        version: { increment: 1 },
      },
    });
  } else {
    await db().zakatPlan.create({
      data: {
        userId: profile.id,
        periodYear,
        dueDate: input.dueDate,
        status: input.status as PrismaZakatPlanStatus,
        secretCiphertext,
        encryptionVersion: PRIVATE_ZAKAT_ENCRYPTION_VERSION,
      },
    });
  }

  return getWorshipSnapshot(input.clerkUserId);
}

export async function addZakatPayment(input: {
  clerkUserId: string;
  planId: string;
  amountMinor: string;
  paidOn: string;
  clientMutationId: string;
}): Promise<WorshipSnapshot> {
  if (!isPositiveMinor(input.amountMinor)) {
    throw new WorshipStorageError("INVALID_INPUT", 400, "Enter a valid payment amount.");
  }
  if (!privateDataEncryptionConfigured()) {
    throw new WorshipStorageError(
      "PRIVATE_STORAGE_UNAVAILABLE",
      503,
      "Private Zakat storage is not configured yet.",
    );
  }

  const profile = await requireProfile(input.clerkUserId);
  await db().$transaction(async (tx) => {
    const alreadyRecorded = await tx.zakatPayment.findUnique({
      where: { userId_clientMutationId: { userId: profile.id, clientMutationId: input.clientMutationId } },
    });
    if (alreadyRecorded) {
      if (alreadyRecorded.zakatPlanId !== input.planId) {
        throw new WorshipStorageError("CONFLICT", 409, "This payment request conflicts with an existing record.");
      }
      return;
    }

    const plan = await tx.zakatPlan.findFirst({ where: { id: input.planId, userId: profile.id } });
    if (!plan) {
      throw new WorshipStorageError("NOT_FOUND", 404, "Zakat plan not found.");
    }
    const planSecret = decryptPlan(profile.id, plan);
    const secretCiphertext = encryptPrivateJson(
      { amountMinor: input.amountMinor, currency: planSecret.currency } satisfies PrivateZakatPayment,
      paymentEncryptionContext(profile.id, plan.id, input.clientMutationId),
    );

    await tx.zakatPayment.create({
      data: {
        userId: profile.id,
        zakatPlanId: plan.id,
        paidOn: input.paidOn,
        clientMutationId: input.clientMutationId,
        secretCiphertext,
        encryptionVersion: PRIVATE_ZAKAT_ENCRYPTION_VERSION,
      },
    });

    const payments = await tx.zakatPayment.findMany({
      where: { userId: profile.id, zakatPlanId: plan.id },
      select: {
        zakatPlanId: true,
        clientMutationId: true,
        secretCiphertext: true,
        encryptionVersion: true,
      },
    });
    const totalPaidMinor = payments.reduce(
      (total, payment) => total + BigInt(decryptPayment(profile.id, payment).amountMinor),
      BigInt(0),
    );
    const nextStatus: PrismaZakatPlanStatus = totalPaidMinor >= BigInt(planSecret.amountMinor)
      ? "PAID"
      : "PARTIALLY_PAID";

    await tx.zakatPlan.update({
      where: { id: plan.id },
      data: { status: nextStatus, version: { increment: 1 } },
    });
  });

  return getWorshipSnapshot(input.clerkUserId);
}
