import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailConfig } from "@/lib/email/config.server";
import { sendRawEmail } from "@/lib/email/service.server";
import { invitationTemplate } from "@/lib/email/templates/invitation";
import { createUnsubscribeToken } from "@/lib/email/unsubscribe-token.server";
import { isValidBearerToken } from "@/lib/timing-safe";

export const maxDuration = 60;

const MAX_RECIPIENTS = 75;
const SEND_INTERVAL_MS = 600;
const CAMPAIGN_ID = "latest-product-update-2026-07";

type Recipient = {
  email: string;
  firstName?: string | null;
};

type ResolvedRecipient = {
  clerkUserId: string | null;
  email: string;
  firstName: string | null;
};

type RequestBody = {
  action?: "preview" | "send";
  audience?: "all-users";
  limit?: number;
  recipients?: Recipient[];
};

type SkippedRecipient = {
  clerkUserId: string;
  email: string | null;
  reason: "missing_email" | "unverified_email" | "unsubscribed" | "suppressed";
};

function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeManualRecipients(recipients: Recipient[]): ResolvedRecipient[] {
  const unique = new Map<string, ResolvedRecipient>();

  for (const recipient of recipients) {
    const email = recipient.email?.trim().toLowerCase();
    if (!email || !isEmailAddress(email)) {
      throw new Error(`Invalid recipient email: ${recipient.email || "(empty)"}`);
    }

    if (!unique.has(email)) {
      unique.set(email, {
        clerkUserId: null,
        email,
        firstName: recipient.firstName?.trim().slice(0, 80) || null,
      });
    }
  }

  return [...unique.values()];
}

async function resolveClerkAudience(limit: number): Promise<{
  recipients: ResolvedRecipient[];
  skipped: SkippedRecipient[];
  totalAvailable: number;
}> {
  const clerk = await clerkClient();
  const response = await clerk.users.getUserList({ limit, offset: 0 });
  const clerkUsers = response.data;
  const profiles = await db().userProfile.findMany({
    where: { clerkUserId: { in: clerkUsers.map((user) => user.id) } },
    select: {
      clerkUserId: true,
      emailSuppressedAt: true,
      emailUnsubscribedAt: true,
    },
  });
  const profileByClerkId = new Map(profiles.map((profile) => [profile.clerkUserId, profile]));
  const recipients: ResolvedRecipient[] = [];
  const skipped: SkippedRecipient[] = [];
  const seenEmails = new Set<string>();

  for (const user of clerkUsers) {
    const primaryEmail = user.primaryEmailAddress ?? user.emailAddresses[0] ?? null;
    const email = primaryEmail?.emailAddress.trim().toLowerCase() ?? null;
    if (!email) {
      skipped.push({ clerkUserId: user.id, email: null, reason: "missing_email" });
      continue;
    }
    if (primaryEmail.verification?.status !== "verified") {
      skipped.push({ clerkUserId: user.id, email, reason: "unverified_email" });
      continue;
    }

    const profile = profileByClerkId.get(user.id);
    if (profile?.emailSuppressedAt) {
      skipped.push({ clerkUserId: user.id, email, reason: "suppressed" });
      continue;
    }
    if (profile?.emailUnsubscribedAt) {
      skipped.push({ clerkUserId: user.id, email, reason: "unsubscribed" });
      continue;
    }
    if (seenEmails.has(email)) {
      continue;
    }

    seenEmails.add(email);
    recipients.push({
      clerkUserId: user.id,
      email,
      firstName: user.firstName?.trim().slice(0, 80) || null,
    });
  }

  return {
    recipients,
    skipped,
    totalAvailable: response.totalCount,
  };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function unsubscribeUrlFor(recipient: ResolvedRecipient, appUrl: string, replyTo: string | null) {
  if (recipient.clerkUserId) {
    const token = createUnsubscribeToken({
      clerkUserId: recipient.clerkUserId,
      expiresAt: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
    });
    return `${appUrl}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
  }

  const replyToAddress = replyTo?.match(/<([^>]+)>/)?.[1] ?? replyTo;
  return replyToAddress
    ? `mailto:${replyToAddress}?subject=${encodeURIComponent("Unsubscribe from Hifzer product updates")}`
    : `${appUrl}/settings/reminders`;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cfg = emailConfig();
  if (!isValidBearerToken(authHeader, cfg.cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action ?? "preview";
  const requestedLimit = Number.isFinite(body.limit) ? Math.floor(body.limit as number) : MAX_RECIPIENTS;
  const limit = Math.max(1, Math.min(requestedLimit, MAX_RECIPIENTS));

  let recipients: ResolvedRecipient[];
  let skipped: SkippedRecipient[] = [];
  let totalAvailable: number | null = null;

  try {
    if (body.audience === "all-users") {
      const audience = await resolveClerkAudience(limit);
      recipients = audience.recipients;
      skipped = audience.skipped;
      totalAvailable = audience.totalAvailable;
    } else if (Array.isArray(body.recipients) && body.recipients.length > 0) {
      recipients = normalizeManualRecipients(body.recipients);
    } else {
      return NextResponse.json(
        { error: "Set audience to all-users or provide a non-empty recipients array." },
        { status: 400 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve recipients.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_RECIPIENTS} recipients per request.` },
      { status: 400 },
    );
  }

  const preview = recipients.map((recipient) => ({
    email: recipient.email,
    firstName: recipient.firstName,
  }));

  if (action === "preview" || cfg.dryRun) {
    return NextResponse.json({
      action: cfg.dryRun && action === "send" ? "dry-run" : "preview",
      campaignId: CAMPAIGN_ID,
      totalAvailable,
      eligible: recipients.length,
      skipped,
      recipients: preview,
    });
  }

  const results: Array<{
    email: string;
    firstName: string | null;
    ok: boolean;
    messageId?: string | null;
    error?: string;
  }> = [];

  for (const [index, recipient] of recipients.entries()) {
    if (index > 0) {
      await wait(SEND_INTERVAL_MS);
    }

    const unsubscribeUrl = unsubscribeUrlFor(recipient, cfg.appUrl, cfg.replyTo);
    const rendered = invitationTemplate({
      appUrl: cfg.appUrl,
      firstName: recipient.firstName,
      openUrl: `${cfg.appUrl}/dashboard`,
      unsubscribeUrl,
    });
    const idempotencyKey = ["hifzer", CAMPAIGN_ID, recipient.email].join(":");
    const result = await sendRawEmail({
      to: recipient.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
      },
    });

    if (result.ok) {
      results.push({
        email: recipient.email,
        firstName: recipient.firstName,
        ok: true,
        messageId: result.messageId,
      });
    } else {
      results.push({
        email: recipient.email,
        firstName: recipient.firstName,
        ok: false,
        error: result.errorMessage,
      });
    }
  }

  const sent = results.filter((result) => result.ok).length;
  const failed = results.length - sent;

  return NextResponse.json({
    action: "send",
    campaignId: CAMPAIGN_ID,
    totalAvailable,
    eligible: recipients.length,
    skipped,
    sent,
    failed,
    results,
  });
}
