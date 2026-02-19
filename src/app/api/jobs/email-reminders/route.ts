import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { emailConfig } from "@/lib/email/config.server";
import { runReminderScheduler } from "@/lib/email/reminder-scheduler.server";
import { isValidBearerToken } from "@/lib/timing-safe";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const header = req.headers.get("authorization");
  // Use timing-safe comparison to prevent side-channel secret extraction
  return isValidBearerToken(header, emailConfig().cronSecret);
}

async function handleCron(req: Request, method: "GET" | "POST") {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runReminderScheduler(new Date());
    return NextResponse.json({
      ok: true,
      ...summary,
      provider: "resend",
      template: "daily_practice_reminder",
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        route: "/api/jobs/email-reminders",
        method,
        provider: "resend",
        template: "daily_practice_reminder",
      },
    });
    return NextResponse.json({ error: "Reminder scheduler failed." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleCron(req, "GET");
}

export async function POST(req: Request) {
  return handleCron(req, "POST");
}
