import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { saveReminderPrefs } from "@/hifzer/profile/server";

type Payload = {
  reminderTimeLocal?: unknown;
  emailRemindersEnabled?: unknown;
};

function validTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof payload.reminderTimeLocal !== "string") {
    return NextResponse.json({ error: "reminderTimeLocal must use HH:MM (24h)." }, { status: 400 });
  }
  if (typeof payload.emailRemindersEnabled !== "boolean") {
    return NextResponse.json({ error: "emailRemindersEnabled must be boolean." }, { status: 400 });
  }

  const reminderTimeLocal = payload.reminderTimeLocal.trim();
  const emailRemindersEnabled = payload.emailRemindersEnabled;
  if (!validTime(reminderTimeLocal)) {
    return NextResponse.json({ error: "reminderTimeLocal must use HH:MM (24h)." }, { status: 400 });
  }

  try {
    const profile = await saveReminderPrefs({
      clerkUserId: userId,
      reminderTimeLocal,
      emailRemindersEnabled,
    });
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save reminder settings.";
    Sentry.captureException(error, {
      tags: { route: "/api/profile/reminders", method: "POST" },
      user: { id: userId },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
