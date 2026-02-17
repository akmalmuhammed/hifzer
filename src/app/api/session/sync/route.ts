import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { SessionEventInput } from "@/hifzer/engine/types";
import { completeSession } from "@/hifzer/engine/server";

type LegacyAttempt = {
  ayahId?: unknown;
  stage?: unknown;
  grade?: unknown;
  createdAt?: unknown;
};

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

function toBool(input: unknown): boolean {
  if (typeof input === "boolean") {
    return input;
  }
  if (typeof input === "string") {
    return input === "true" || input === "1";
  }
  if (typeof input === "number") {
    return input === 1;
  }
  return false;
}

function derivePhase(stage: SessionEventInput["stage"], phaseRaw: unknown): SessionEventInput["phase"] {
  const phase = String(phaseRaw ?? "").trim();
  if (phase) {
    return phase as SessionEventInput["phase"];
  }
  if (stage === "NEW") {
    return "NEW_BLIND";
  }
  if (stage === "WEEKLY_TEST") {
    return "WEEKLY_TEST";
  }
  if (stage === "LINK_REPAIR") {
    return "LINK_REPAIR";
  }
  return "STANDARD";
}

function normalizeEventRows(input: unknown): SessionEventInput[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const out: SessionEventInput[] = [];
  input.forEach((row, idx) => {
    const item = row as LegacyAttempt & Record<string, unknown>;
    const ayahId = Number(item.ayahId);
    const stepIndexRaw = Number(item.stepIndex);
    const stepIndex = Number.isFinite(stepIndexRaw) ? stepIndexRaw : idx;
    const stage = String(item.stage ?? "").trim() as SessionEventInput["stage"];
    const gradeRaw = item.grade == null ? null : String(item.grade).trim();
    const createdAt = String(item.createdAt ?? "");
    const durationSec = Number(item.durationSec);
    if (!Number.isFinite(ayahId) || !createdAt) {
      return;
    }
    out.push({
      stepIndex,
      ayahId,
      stage,
      phase: derivePhase(stage, item.phase),
      fromAyahId: Number(item.fromAyahId),
      toAyahId: Number(item.toAyahId),
      grade: gradeRaw as SessionEventInput["grade"],
      durationSec: Number.isFinite(durationSec) ? durationSec : 0,
      textVisible: toBool(item.textVisible),
      assisted: toBool(item.assisted),
      createdAt,
    });
  });
  return out;
}

function normalizeSessionList(input: unknown): SessionSyncInput[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const out: SessionSyncInput[] = [];
  for (const row of input) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const raw = row as Record<string, unknown>;
    const sessionId = String(raw.sessionId ?? "");
    const startedAt = String(raw.startedAt ?? "");
    const endedAt = String(raw.endedAt ?? "");
    const localDate = raw.localDate == null ? undefined : String(raw.localDate);
    const events = normalizeEventRows(raw.events);
    if (!sessionId || !startedAt || !endedAt || !events.length) {
      continue;
    }
    out.push({ sessionId, startedAt, endedAt, localDate, events });
  }
  return out;
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

  const normalized = normalizeSessionList(payload.sessions);
  if (!normalized.length) {
    const startedAt = String(payload.startedAt ?? "");
    const endedAt = String(payload.endedAt ?? "");
    const localDate = payload.localDate == null ? undefined : String(payload.localDate);
    const events = normalizeEventRows(payload.attempts);
    if (!startedAt || !endedAt || !events.length) {
      return NextResponse.json({ error: "No sync sessions found in payload." }, { status: 400 });
    }
    const startedMs = new Date(startedAt).getTime();
    const sessionId = Number.isFinite(startedMs) ? `sync_${startedMs}` : `sync_${Date.now()}`;
    normalized.push({ sessionId, startedAt, endedAt, localDate, events });
  }

  const results: Array<{ sessionId: string; ok: boolean; skipped?: boolean; error?: string }> = [];
  for (const item of normalized) {
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
      });
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
