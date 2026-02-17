import { EventName, type EventEntity } from "@paddle/paddle-node-sdk";
import type { Prisma, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db, dbConfigured } from "@/lib/db";
import { paddleClient, paddleConfigured, paddleWebhookSecret } from "@/lib/paddle.server";

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

  await applyProfileUpdate({
    clerkUserId: readClerkUserId(data.customData),
    customerId: data.customerId ?? null,
    data: updateData,
  });
}

async function handleTransactionCompleted(event: EventEntity) {
  const data = event.data as {
    customerId?: string | null;
    subscriptionId?: string | null;
    customData?: Record<string, unknown> | null;
    billingPeriod?: { endsAt?: string } | null;
  };

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
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  if (
    event.eventType === EventName.SubscriptionCreated ||
    event.eventType === EventName.SubscriptionUpdated ||
    event.eventType === EventName.SubscriptionCanceled ||
    event.eventType === EventName.SubscriptionPastDue ||
    event.eventType === EventName.SubscriptionPaused ||
    event.eventType === EventName.SubscriptionResumed
  ) {
    await handleSubscriptionEvent(event);
    return NextResponse.json({ ok: true });
  }

  if (event.eventType === EventName.TransactionCompleted) {
    await handleTransactionCompleted(event);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, ignored: event.eventType });
}
