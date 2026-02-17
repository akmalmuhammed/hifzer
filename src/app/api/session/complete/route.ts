import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { SessionEventInput } from "@/hifzer/engine/types";
import { completeSession } from "@/hifzer/engine/server";

type Payload = {
  sessionId?: unknown;
  startedAt?: unknown;
  endedAt?: unknown;
  localDate?: unknown;
  events?: unknown;
};

function normalizeEvents(input: unknown): SessionEventInput[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const out: SessionEventInput[] = [];
  for (const row of input) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const raw = row as Record<string, unknown>;
    const stepIndex = Number(raw.stepIndex);
    const stage = String(raw.stage ?? "").trim() as SessionEventInput["stage"];
    const phase = String(raw.phase ?? "").trim() as SessionEventInput["phase"];
    const ayahId = Number(raw.ayahId);
    const durationSec = Number(raw.durationSec);
    const createdAt = String(raw.createdAt ?? "");
    const gradeRaw = raw.grade == null ? null : String(raw.grade).trim();
    if (!Number.isFinite(stepIndex) || !Number.isFinite(ayahId) || !createdAt) {
      continue;
    }
    out.push({
      stepIndex,
      stage,
      phase,
      ayahId,
      fromAyahId: Number(raw.fromAyahId),
      toAyahId: Number(raw.toAyahId),
      grade: gradeRaw as SessionEventInput["grade"],
      durationSec: Number.isFinite(durationSec) ? durationSec : 0,
      createdAt,
    });
  }
  return out;
}

export const runtime = "nodejs";

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

  const sessionId = String(payload.sessionId ?? "");
  const startedAt = String(payload.startedAt ?? "");
  const endedAt = String(payload.endedAt ?? "");
  const localDate = payload.localDate == null ? undefined : String(payload.localDate);
  const events = normalizeEvents(payload.events);
  if (!sessionId || !startedAt || !endedAt || events.length === 0) {
    return NextResponse.json({ error: "sessionId, startedAt, endedAt, and events are required." }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "Failed to complete session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

