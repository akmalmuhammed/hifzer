import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { completeSession } from "@/hifzer/engine/server";
import type { SessionEventInput } from "@/hifzer/engine/types";
import {
  isSessionGuardError,
  parseSessionEventList,
} from "@/hifzer/engine/session-guard";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

type Payload = {
  sessionId?: unknown;
  startedAt?: unknown;
  endedAt?: unknown;
  localDate?: unknown;
  events?: unknown;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await resolveClerkUserIdForServer(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sessionId = String(payload.sessionId ?? "");
  const startedAt = String(payload.startedAt ?? "");
  const endedAt = String(payload.endedAt ?? "");
  const localDate = payload.localDate == null ? undefined : String(payload.localDate);
  let events: SessionEventInput[];
  try {
    events = parseSessionEventList(payload.events);
  } catch (error) {
    if (isSessionGuardError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code, permanent: true },
        { status: error.status },
      );
    }
    Sentry.captureException(error, {
      tags: { route: "/api/session/complete", method: "POST", stage: "parse" },
      user: { id: userId },
    });
    return NextResponse.json({ error: "Failed to parse session events." }, { status: 500 });
  }
  if (!sessionId || !startedAt || !endedAt || events.length === 0) {
    return NextResponse.json({ error: "sessionId, startedAt, endedAt, and events are required." }, { status: 400 });
  }
  if (Number.isNaN(new Date(startedAt).getTime()) || Number.isNaN(new Date(endedAt).getTime())) {
    return NextResponse.json({ error: "startedAt and endedAt must be valid timestamps." }, { status: 400 });
  }
  if (localDate && !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    return NextResponse.json({ error: "localDate must be YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const result = await completeSession({
      clerkUserId: userId,
      sessionId,
      startedAt,
      endedAt,
      localDate,
      events,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (isSessionGuardError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code, permanent: true },
        { status: error.status },
      );
    }
    Sentry.captureException(error, {
      tags: { route: "/api/session/complete", method: "POST" },
      user: { id: userId },
      extra: { eventCount: events.length },
    });
    return NextResponse.json({ error: "Failed to complete session." }, { status: 500 });
  }
}
