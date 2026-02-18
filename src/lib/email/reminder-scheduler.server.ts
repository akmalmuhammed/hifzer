import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { emailConfig } from "@/lib/email/config.server";
import { dispatchDailyPracticeReminder } from "@/lib/email/service.server";
import { captureServerPosthogEvent } from "@/lib/posthog/server";

const MINUTES_PER_DAY = 24 * 60;
const REMINDER_WINDOW_MINUTES = 35;

const WEEKDAY_MAP: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export type SchedulerCandidate = {
  id: string;
  clerkUserId: string;
  timezone: string;
  reminderTimeLocal: string;
  practiceDays: number[];
  onboardingCompletedAt: Date | null;
  emailRemindersEnabled: boolean;
  emailSuppressedAt: Date | null;
  emailUnsubscribedAt: Date | null;
};

export type ReminderEligibility = {
  eligible: boolean;
  reason: string;
  localDate: string;
  weekday: number;
};

type LocalClock = {
  localDate: string;
  weekday: number;
  minuteOfDay: number;
};

function formatLocalClock(now: Date, timezone: string): LocalClock {
  const safeTz = timezone && timezone.trim() ? timezone.trim() : "UTC";
  let parts: Intl.DateTimeFormatPart[];
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    parts = formatter.formatToParts(now);
  } catch {
    const fallback = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    parts = fallback.formatToParts(now);
  }
  const byType = new Map<string, string>();
  for (const part of parts) {
    byType.set(part.type, part.value);
  }
  const year = byType.get("year") ?? "1970";
  const month = byType.get("month") ?? "01";
  const day = byType.get("day") ?? "01";
  const weekdayRaw = (byType.get("weekday") ?? "sun").slice(0, 3).toLowerCase();
  const hour = Number(byType.get("hour") ?? "0");
  const minute = Number(byType.get("minute") ?? "0");
  return {
    localDate: `${year}-${month}-${day}`,
    weekday: WEEKDAY_MAP[weekdayRaw] ?? 0,
    minuteOfDay: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
  };
}

export function parseReminderTimeToMinutes(value: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) {
    return null;
  }
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return (hour * 60) + minute;
}

function circularMinuteDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % MINUTES_PER_DAY;
  return Math.min(diff, MINUTES_PER_DAY - diff);
}

export function isWithinReminderWindow(input: {
  nowMinuteOfDay: number;
  reminderMinuteOfDay: number;
  windowMinutes?: number;
}): boolean {
  const window = input.windowMinutes ?? REMINDER_WINDOW_MINUTES;
  return circularMinuteDistance(input.nowMinuteOfDay, input.reminderMinuteOfDay) <= Math.max(0, window);
}

export function evaluateReminderEligibility(input: {
  candidate: SchedulerCandidate;
  now: Date;
}): ReminderEligibility {
  const localClock = formatLocalClock(input.now, input.candidate.timezone);
  if (!input.candidate.onboardingCompletedAt) {
    return { eligible: false, reason: "not_onboarded", localDate: localClock.localDate, weekday: localClock.weekday };
  }
  if (!input.candidate.emailRemindersEnabled) {
    return { eligible: false, reason: "disabled", localDate: localClock.localDate, weekday: localClock.weekday };
  }
  if (input.candidate.emailSuppressedAt) {
    return { eligible: false, reason: "suppressed", localDate: localClock.localDate, weekday: localClock.weekday };
  }
  if (input.candidate.emailUnsubscribedAt) {
    return { eligible: false, reason: "unsubscribed", localDate: localClock.localDate, weekday: localClock.weekday };
  }
  if (!input.candidate.practiceDays.includes(localClock.weekday)) {
    return { eligible: false, reason: "off_day", localDate: localClock.localDate, weekday: localClock.weekday };
  }

  const reminderMinuteOfDay = parseReminderTimeToMinutes(input.candidate.reminderTimeLocal);
  if (reminderMinuteOfDay == null) {
    return { eligible: false, reason: "invalid_reminder_time", localDate: localClock.localDate, weekday: localClock.weekday };
  }
  if (!isWithinReminderWindow({
    nowMinuteOfDay: localClock.minuteOfDay,
    reminderMinuteOfDay,
    windowMinutes: REMINDER_WINDOW_MINUTES,
  })) {
    return { eligible: false, reason: "outside_window", localDate: localClock.localDate, weekday: localClock.weekday };
  }
  return { eligible: true, reason: "ok", localDate: localClock.localDate, weekday: localClock.weekday };
}

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type ReminderRunSummary = {
  evaluated: number;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  capReached: boolean;
  dryRun: boolean;
};

export async function runReminderScheduler(now = new Date()): Promise<ReminderRunSummary> {
  const cfg = emailConfig();
  const prisma = db();
  const summary: ReminderRunSummary = {
    evaluated: 0,
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    capReached: false,
    dryRun: cfg.dryRun,
  };

  const [sentToday, sentMonth] = await Promise.all([
    prisma.emailDispatch.count({
      where: {
        status: "SENT",
        createdAt: { gte: startOfUtcDay(now) },
      },
    }),
    prisma.emailDispatch.count({
      where: {
        status: "SENT",
        createdAt: { gte: startOfUtcMonth(now) },
      },
    }),
  ]);
  let sentCounterToday = sentToday;
  let sentCounterMonth = sentMonth;

  const candidates = await prisma.userProfile.findMany({
    where: {
      onboardingCompletedAt: { not: null },
      emailRemindersEnabled: true,
      emailSuppressedAt: null,
      emailUnsubscribedAt: null,
    },
    select: {
      id: true,
      clerkUserId: true,
      timezone: true,
      reminderTimeLocal: true,
      practiceDays: true,
      onboardingCompletedAt: true,
      emailRemindersEnabled: true,
      emailSuppressedAt: true,
      emailUnsubscribedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const clerk = await clerkClient();

  for (const candidate of candidates) {
    summary.evaluated += 1;
    const rule = evaluateReminderEligibility({ candidate, now });
    if (!rule.eligible) {
      summary.skipped += 1;
      await captureServerPosthogEvent("email.reminder.skipped", {
        userId: candidate.id,
        reason: rule.reason,
        localDate: rule.localDate,
      });
      continue;
    }

    if (sentCounterToday >= cfg.dailyCap || sentCounterMonth >= cfg.monthlyCap) {
      summary.capReached = true;
      break;
    }

    const hasCompletedSession = await prisma.session.findFirst({
      where: {
        userId: candidate.id,
        status: "COMPLETED",
        localDate: rule.localDate,
      },
      select: { id: true },
    });
    if (hasCompletedSession) {
      summary.skipped += 1;
      await captureServerPosthogEvent("email.reminder.skipped", {
        userId: candidate.id,
        reason: "session_completed_today",
        localDate: rule.localDate,
      });
      continue;
    }

    let emailAddress: string | null = null;
    let firstName: string | null = null;
    try {
      const user = await clerk.users.getUser(candidate.clerkUserId);
      emailAddress = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null;
      firstName = user.firstName ?? null;
    } catch (error) {
      summary.failed += 1;
      Sentry.captureException(error, {
        tags: { area: "email-reminders", provider: "resend", template: "daily_practice_reminder" },
        extra: { clerkUserId: candidate.clerkUserId },
      });
      await captureServerPosthogEvent("email.reminder.failed", {
        userId: candidate.id,
        reason: "clerk_lookup_failed",
        localDate: rule.localDate,
      });
      continue;
    }

    if (!emailAddress) {
      summary.skipped += 1;
      await captureServerPosthogEvent("email.reminder.skipped", {
        userId: candidate.id,
        reason: "missing_email",
        localDate: rule.localDate,
      });
      continue;
    }

    summary.eligible += 1;
    await captureServerPosthogEvent("email.reminder.scheduled", {
      userId: candidate.id,
      localDate: rule.localDate,
      dryRun: cfg.dryRun,
    });

    const dispatch = await dispatchDailyPracticeReminder({
      userId: candidate.id,
      clerkUserId: candidate.clerkUserId,
      localDate: rule.localDate,
      to: emailAddress,
      firstName,
      reminderTimeLocal: candidate.reminderTimeLocal,
      timezone: candidate.timezone,
    });

    if (dispatch.outcome === "sent") {
      summary.sent += 1;
      sentCounterToday += 1;
      sentCounterMonth += 1;
      await captureServerPosthogEvent("email.reminder.sent", {
        userId: candidate.id,
        localDate: rule.localDate,
      });
      continue;
    }

    if (dispatch.outcome === "dry_run") {
      summary.skipped += 1;
      await captureServerPosthogEvent("email.reminder.skipped", {
        userId: candidate.id,
        reason: "dry_run",
        localDate: rule.localDate,
      });
      continue;
    }

    if (dispatch.outcome === "skipped") {
      summary.skipped += 1;
      await captureServerPosthogEvent("email.reminder.skipped", {
        userId: candidate.id,
        reason: dispatch.reason ?? "skipped",
        localDate: rule.localDate,
      });
      continue;
    }

    summary.failed += 1;
    await captureServerPosthogEvent("email.reminder.failed", {
      userId: candidate.id,
      reason: dispatch.reason ?? "send_failed",
      localDate: rule.localDate,
    });
  }

  return summary;
}
