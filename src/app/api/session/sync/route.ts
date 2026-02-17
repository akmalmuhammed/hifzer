import { auth } from "@clerk/nextjs/server";
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

function normalizeLegacyEvents(input: unknown): SessionEventInput[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const out: SessionEventInput[] = [];
  input.forEach((row, idx) => {
    const item = row as LegacyAttempt;
    const ayahId = Number(item.ayahId);
    const stage = String(item.stage ?? "").trim() as SessionEventInput["stage"];
    const grade = String(item.grade ?? "").trim() as SessionEventInput["grade"];
    const createdAt = String(item.createdAt ?? "");
    if (!Number.isFinite(ayahId) || !createdAt) {
      return;
    }
    let phase: SessionEventInput["phase"] = "STANDARD";
    if (stage === "NEW") {
      phase = "NEW_BLIND";
    } else if (stage === "WEEKLY_TEST") {
      phase = "WEEKLY_TEST";
    } else if (stage === "LINK_REPAIR") {
      phase = "LINK_REPAIR";
    }
    out.push({
      stepIndex: idx,
      ayahId,
      stage,
      phase,
      grade,
      durationSec: 0,
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
    const events = normalizeLegacyEvents(raw.events);
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
    const events = normalizeLegacyEvents(payload.attempts);
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
      results.push({
        sessionId: item.sessionId,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown sync error.",
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

