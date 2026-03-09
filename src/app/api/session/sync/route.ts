import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { SessionEventInput } from "@/hifzer/engine/types";
import { completeSession } from "@/hifzer/engine/server";
import {
  isSessionGuardError,
  parseSessionEventList,
} from "@/hifzer/engine/session-guard";

type LegacyPayload = {
  localDate?: unknown;
  startedAt?: unknown;
  endedAt?: unknown;
  attempts?: unknown;
};

type SyncPayload = {
  sessions?: unknown;
} & LegacyPayload;

type SessionSyncInput = {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  localDate?: string;
  events: SessionEventInput[];
};

type SyncResult = {
  sessionId: string;
  ok: boolean;
  skipped?: boolean;
  error?: string;
  code?: string;
  permanent?: boolean;
};

function parseTimestamp(value: unknown, field: "startedAt" | "endedAt"): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`${field} must be a valid timestamp.`);
  }
  return timestamp.toISOString();
}

function parseOptionalLocalDate(value: unknown): string | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("localDate must be YYYY-MM-DD.");
  }
  return value;
}

function parseSessionRow(row: unknown): SessionSyncInput {
  if (!row || typeof row !== "object") {
    throw new Error("Each sync session must be an object.");
  }
  const raw = row as Record<string, unknown>;
  const sessionId = String(raw.sessionId ?? "").trim();
  if (!sessionId) {
    throw new Error("sessionId is required.");
  }
  const startedAt = parseTimestamp(raw.startedAt, "startedAt");
  const endedAt = parseTimestamp(raw.endedAt, "endedAt");
  const localDate = parseOptionalLocalDate(raw.localDate);
  const events = parseSessionEventList(raw.events, {
    allowDerivedPhase: true,
    allowFallbackStepIndex: true,
  });
  if (events.length < 1) {
    throw new Error("events must contain at least one item.");
  }
  return { sessionId, startedAt, endedAt, localDate, events };
}

function toPermanentResult(sessionId: string, error: unknown): SyncResult {
  if (isSessionGuardError(error)) {
    return {
      sessionId,
      ok: false,
      error: error.message,
      code: error.code,
      permanent: true,
    };
  }
  return {
    sessionId,
    ok: false,
    error: error instanceof Error ? error.message : "Invalid sync payload.",
    code: "invalid_session_payload",
    permanent: true,
  };
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SyncPayload;
  try {
    payload = (await req.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const results: SyncResult[] = [];

  if (Array.isArray(payload.sessions)) {
    if (payload.sessions.length < 1) {
      return NextResponse.json({ error: "No sync sessions found in payload." }, { status: 400 });
    }
    payload.sessions.forEach((row, idx) => {
      try {
        const item = parseSessionRow(row);
        results.push({
          sessionId: item.sessionId,
          ok: false,
          error: "__pending__",
          permanent: false,
        });
      } catch (error) {
        const raw = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
        const sessionId = typeof raw?.sessionId === "string" && raw.sessionId.trim()
          ? raw.sessionId.trim()
          : `invalid_${idx}`;
        results.push(toPermanentResult(sessionId, error));
      }
    });
    for (let idx = 0; idx < payload.sessions.length; idx += 1) {
      const row = payload.sessions[idx];
      try {
        const item = parseSessionRow(row);
        const result = await completeSession({
          clerkUserId: userId,
          sessionId: item.sessionId,
          startedAt: item.startedAt,
          endedAt: item.endedAt,
          localDate: item.localDate,
          events: item.events,
        });
        results[idx] = { sessionId: item.sessionId, ok: true, skipped: result.skipped };
      } catch (error) {
        if (results[idx]?.error !== "__pending__") {
          continue;
        }
        if (isSessionGuardError(error)) {
          results[idx] = {
            sessionId: results[idx]?.sessionId ?? `invalid_${idx}`,
            ok: false,
            error: error.message,
            code: error.code,
            permanent: true,
          };
          continue;
        }
        const message = error instanceof Error ? error.message : "Unknown sync error.";
        Sentry.captureException(error, {
          tags: { route: "/api/session/sync", method: "POST" },
          user: { id: userId },
          extra: {
            sessionId: results[idx]?.sessionId ?? `invalid_${idx}`,
          },
        });
        results[idx] = {
          sessionId: results[idx]?.sessionId ?? `invalid_${idx}`,
          ok: false,
          error: message,
          code: "sync_failed",
          permanent: false,
        };
      }
    }
  } else {
    let item: SessionSyncInput;
    try {
      const startedAt = parseTimestamp(payload.startedAt, "startedAt");
      const endedAt = parseTimestamp(payload.endedAt, "endedAt");
      const localDate = parseOptionalLocalDate(payload.localDate);
      const events = parseSessionEventList(payload.attempts, {
        allowDerivedPhase: true,
        allowFallbackStepIndex: true,
      });
      if (events.length < 1) {
        throw new Error("attempts must contain at least one item.");
      }
      const startedMs = new Date(startedAt).getTime();
      const sessionId = Number.isFinite(startedMs) ? `sync_${startedMs}` : `sync_${Date.now()}`;
      item = { sessionId, startedAt, endedAt, localDate, events };
    } catch (error) {
      return NextResponse.json(toPermanentResult("legacy_sync", error), { status: 400 });
    }

    try {
      const result = await completeSession({
        clerkUserId: userId,
        sessionId: item.sessionId,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        localDate: item.localDate,
        events: item.events,
      });
      results.push({ sessionId: item.sessionId, ok: true, skipped: result.skipped });
    } catch (error) {
      if (isSessionGuardError(error)) {
        results.push({
          sessionId: item.sessionId,
          ok: false,
          error: error.message,
          code: error.code,
          permanent: true,
        });
      } else {
        const message = error instanceof Error ? error.message : "Unknown sync error.";
        Sentry.captureException(error, {
          tags: { route: "/api/session/sync", method: "POST" },
          user: { id: userId },
          extra: {
            sessionId: item.sessionId,
            eventCount: item.events.length,
          },
        });
        results.push({
          sessionId: item.sessionId,
          ok: false,
          error: message,
          code: "sync_failed",
          permanent: false,
        });
      }
    }
  }

  const successCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    ok: successCount === results.length,
    successCount,
    total: results.length,
    results,
  });
}
