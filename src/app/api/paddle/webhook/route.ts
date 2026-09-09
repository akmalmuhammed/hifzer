import { EventName, type EventEntity } from "@paddle/paddle-node-sdk";
import type { Prisma, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db, dbConfigured } from "@/lib/db";
import { paddleClient, paddleConfigured, paddleWebhookSecret } from "@/lib/paddle.server";
import { classifyPremiumTransaction, entitlementStatusForAdjustment } from "@/hifzer/billing/entitlement";
import { invalidateDashboardCaches } from "@/hifzer/dashboard/cache";

export const runtime = "nodejs";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toSubscriptionStatus(value: string | undefined): SubscriptionStatus | null {
  if (value === "active") {
    return "ACTIVE";
  }
  if (value === "trialing") {
    return "TRIALING";
  }
  if (value === "past_due") {
    return "PAST_DUE";
  }
  if (value === "paused") {
    return "PAUSED";
  }
  if (value === "canceled") {
    return "CANCELED";
  }
  return null;
}

function toPlan(status: SubscriptionStatus | null): SubscriptionPlan {
  return status && status !== "CANCELED" ? "PAID" : "FREE";
}

function readClerkUserId(customData: unknown): string | null {
  if (!customData || typeof customData !== "object") {
    return null;
  }
  const value = (customData as Record<string, unknown>).clerk_user_id;
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function applyProfileUpdate(args: {
  clerkUserId: string | null;
  customerId: string | null;
  data: Prisma.UserProfileUpdateManyMutationInput;
}) {
  const prisma = db();

  if (args.clerkUserId) {
    await getOrCreateUserProfile(args.clerkUserId);
    await prisma.userProfile.updateMany({
      where: { clerkUserId: args.clerkUserId },
      data: args.data,
    });
    return;
  }

  if (args.customerId) {
    await prisma.userProfile.updateMany({
      where: { paddleCustomerId: args.customerId },
      data: args.data,
    });
  }
}

async function handleSubscriptionEvent(event: EventEntity) {
  const data = event.data as {
    id?: string;
    status?: string;
    customerId?: string | null;
    customData?: Record<string, unknown> | null;
    currentBillingPeriod?: { endsAt?: string | null } | null;
  };

  const subscriptionStatus = toSubscriptionStatus(data.status);
  const updateData: Prisma.UserProfileUpdateManyMutationInput = {
    plan: toPlan(subscriptionStatus),
    subscriptionStatus,
    currentPeriodEnd: parseDate(data.currentBillingPeriod?.endsAt),
  };
  if (data.customerId) {
    updateData.paddleCustomerId = data.customerId;
  }
  if (data.id) {
    updateData.paddleSubscriptionId = data.id;
  }

  const clerkUserId = readClerkUserId(data.customData);
  await applyProfileUpdate({
    clerkUserId,
    customerId: data.customerId ?? null,
    data: updateData,
  });

  const prisma = db();
  const profile = clerkUserId
    ? await prisma.userProfile.findUnique({ where: { clerkUserId } })
    : data.customerId
      ? await prisma.userProfile.findUnique({ where: { paddleCustomerId: data.customerId } })
      : null;
  if (profile) {
    const hasLifetime = await prisma.billingEntitlement.count({
      where: { userId: profile.id, status: "ACTIVE" },
    });
    if (hasLifetime > 0 && updateData.plan === "FREE") {
      await prisma.userProfile.update({ where: { id: profile.id }, data: { plan: "PAID" } });
    }
    invalidateDashboardCaches(profile.clerkUserId);
  }
}

async function handleTransactionCompleted(event: EventEntity) {
  const data = event.data as {
    id?: string;
    customerId?: string | null;
    subscriptionId?: string | null;
    customData?: Record<string, unknown> | null;
    billingPeriod?: { endsAt?: string } | null;
  };

  const entitlement = classifyPremiumTransaction(data);
  if (entitlement) {
    const prisma = db();
    const profile = entitlement.clerkUserId
      ? await getOrCreateUserProfile(entitlement.clerkUserId)
      : data.customerId
        ? await prisma.userProfile.findUnique({ where: { paddleCustomerId: data.customerId } })
        : null;

    if (profile) {
      await prisma.$transaction(async (tx) => {
        const durableEntitlement = await tx.billingEntitlement.upsert({
          where: { providerTransactionId: entitlement.transactionId },
          create: {
            userId: profile.id,
            providerTransactionId: entitlement.transactionId,
            kind: "PREMIUM_LIFETIME",
            status: "ACTIVE",
          },
          update: {},
        });
        await tx.userProfile.update({
          where: { id: profile.id },
          data: {
            ...(durableEntitlement.status === "ACTIVE" ? { plan: "PAID" as const } : {}),
            ...(data.customerId ? { paddleCustomerId: data.customerId } : {}),
          },
        });
      });
      invalidateDashboardCaches(profile.clerkUserId);
      return;
    }
    Sentry.captureMessage("Paddle premium transaction could not be matched to a Hifzer profile.", {
      level: "warning",
      tags: { route: "/api/paddle/webhook", code: "premium_profile_unmatched" },
      extra: { transactionId: entitlement.transactionId },
    });
    return;
  }

  const updateData: Prisma.UserProfileUpdateManyMutationInput = {};
  if (data.customerId) {
    updateData.paddleCustomerId = data.customerId;
  }
  if (data.subscriptionId) {
    updateData.paddleSubscriptionId = data.subscriptionId;
    updateData.plan = "PAID";
  }
  const periodEnd = parseDate(data.billingPeriod?.endsAt);
  if (periodEnd) {
    updateData.currentPeriodEnd = periodEnd;
  }
  if (Object.keys(updateData).length === 0) {
    return;
  }

  await applyProfileUpdate({
    clerkUserId: readClerkUserId(data.customData),
    customerId: data.customerId ?? null,
    data: updateData,
  });
}

async function handleAdjustmentUpdated(event: EventEntity) {
  const data = event.data as {
    action?: string;
    status?: string;
    type?: string;
    transactionId?: string;
  };
  if (!data.transactionId) return;

  const nextStatus = entitlementStatusForAdjustment(data);
  if (!nextStatus) return;

  const prisma = db();
  const entitlement = await prisma.billingEntitlement.findUnique({
    where: { providerTransactionId: data.transactionId },
    include: { user: true },
  });
  if (!entitlement) return;

  await prisma.billingEntitlement.update({
    where: { id: entitlement.id },
    data: {
      status: nextStatus,
      revokedAt: nextStatus === "REVOKED" ? new Date() : null,
    },
  });

  const hasActiveLifetime = await prisma.billingEntitlement.count({
    where: { userId: entitlement.userId, status: "ACTIVE" },
  });
  const hasActiveSubscription = entitlement.user.subscriptionStatus != null &&
    entitlement.user.subscriptionStatus !== "CANCELED";
  await prisma.userProfile.update({
    where: { id: entitlement.userId },
    data: { plan: hasActiveLifetime > 0 || hasActiveSubscription ? "PAID" : "FREE" },
  });
  invalidateDashboardCaches(entitlement.user.clerkUserId);
}

export async function POST(req: Request) {
  if (!dbConfigured()) {
    return NextResponse.json({ ok: true, ignored: "database_not_configured" });
  }
  if (!paddleConfigured()) {
    return NextResponse.json({ ok: true, ignored: "paddle_not_configured" });
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing paddle-signature header." }, { status: 400 });
  }

  const requestBody = await req.text();

  let event: EventEntity;
  try {
    event = await paddleClient().webhooks.unmarshal(requestBody, paddleWebhookSecret(), signature);
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "/api/paddle/webhook" } });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 400 });
  }

  if (
    event.eventType === EventName.SubscriptionActivated ||
    event.eventType === EventName.SubscriptionCreated ||
    event.eventType === EventName.SubscriptionUpdated ||
    event.eventType === EventName.SubscriptionCanceled ||
    event.eventType === EventName.SubscriptionPastDue ||
    event.eventType === EventName.SubscriptionPaused ||
    event.eventType === EventName.SubscriptionResumed ||
    event.eventType === EventName.SubscriptionTrialing
  ) {
    await handleSubscriptionEvent(event);
    return NextResponse.json({ ok: true });
  }

  if (event.eventType === EventName.TransactionCompleted) {
    await handleTransactionCompleted(event);
    return NextResponse.json({ ok: true });
  }

  if (event.eventType === EventName.AdjustmentUpdated) {
    await handleAdjustmentUpdated(event);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, ignored: event.eventType });
}
