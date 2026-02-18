import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { emailConfig } from "@/lib/email/config.server";
import { ResendProvider } from "@/lib/email/resend.server";
import { dailyPracticeReminderTemplate } from "@/lib/email/templates/daily-practice-reminder";
import type { EmailSendRequest, EmailSendResult, EmailTemplateKey } from "@/lib/email/types";
import { createUnsubscribeToken } from "@/lib/email/unsubscribe-token.server";

const REMINDER_TEMPLATE: EmailTemplateKey = "daily_practice_reminder";

function provider() {
  return new ResendProvider();
}

function isPrismaUniqueError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002",
  );
}

export async function sendRawEmail(input: EmailSendRequest): Promise<EmailSendResult> {
  return provider().send(input);
}

export type ReminderDispatchResult = {
  outcome: "sent" | "dry_run" | "failed" | "skipped";
  dispatchId: string | null;
  reason: string | null;
};

export async function dispatchDailyPracticeReminder(input: {
  userId: string;
  clerkUserId: string;
  localDate: string;
  to: string;
  firstName: string | null;
  reminderTimeLocal: string;
  timezone: string;
}): Promise<ReminderDispatchResult> {
  const cfg = emailConfig();
  const prisma = db();

  let dispatchRow: { id: string } | null = null;
  try {
    dispatchRow = await prisma.emailDispatch.create({
      data: {
        userId: input.userId,
        templateKey: REMINDER_TEMPLATE,
        localDate: input.localDate,
        status: "PENDING",
        provider: cfg.provider,
      },
      select: { id: true },
    });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return { outcome: "skipped", dispatchId: null, reason: "duplicate_local_day" };
    }
    throw error;
  }

  const token = createUnsubscribeToken({
    clerkUserId: input.clerkUserId,
    expiresAt: new Date(Date.now() + (180 * 24 * 60 * 60 * 1000)),
  });
  const unsubscribeUrl = `${cfg.appUrl}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
  const rendered = dailyPracticeReminderTemplate({
    appUrl: cfg.appUrl,
    unsubscribeUrl,
    firstName: input.firstName,
    reminderTimeLocal: input.reminderTimeLocal,
    timezone: input.timezone,
  });

  if (cfg.dryRun) {
    await prisma.emailDispatch.update({
      where: { id: dispatchRow.id },
      data: {
        status: "DRY_RUN",
      },
    });
    return { outcome: "dry_run", dispatchId: dispatchRow.id, reason: "dry_run" };
  }

  const idempotencyKey = `hifzer:${REMINDER_TEMPLATE}:${input.userId}:${input.localDate}`;
  const sent = await provider().send({
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    idempotencyKey,
  });

  if (sent.ok) {
    await prisma.emailDispatch.update({
      where: { id: dispatchRow.id },
      data: {
        status: "SENT",
        providerMessageId: sent.messageId,
      },
    });
    return { outcome: "sent", dispatchId: dispatchRow.id, reason: null };
  }

  await prisma.emailDispatch.update({
    where: { id: dispatchRow.id },
    data: {
      status: "FAILED",
      errorCode: sent.errorCode,
      errorMessage: sent.errorMessage.slice(0, 500),
    },
  });
  return { outcome: "failed", dispatchId: dispatchRow.id, reason: sent.errorCode ?? "send_failed" };
}

export async function markReminderDispatchSkipped(input: {
  userId: string;
  localDate: string;
  reason: string;
}) {
  const cfg = emailConfig();
  const prisma = db();
  try {
    await prisma.emailDispatch.create({
      data: {
        userId: input.userId,
        templateKey: REMINDER_TEMPLATE,
        localDate: input.localDate,
        status: "SKIPPED",
        provider: cfg.provider,
        errorCode: "SKIPPED",
        errorMessage: input.reason.slice(0, 500),
      },
    });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return;
    }
    throw error;
  }
}

export function reminderTemplateKey(): EmailTemplateKey {
  return REMINDER_TEMPLATE;
}

export type EmailDispatchTemplateKey = typeof REMINDER_TEMPLATE;

export function reminderDispatchWhere(input: {
  userId: string;
  localDate: string;
}): Prisma.EmailDispatchWhereInput {
  return {
    userId: input.userId,
    templateKey: REMINDER_TEMPLATE,
    localDate: input.localDate,
  };
}
