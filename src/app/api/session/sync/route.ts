import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { AttemptStage, SrsGrade } from "@prisma/client";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { applyGrade, defaultReviewState } from "@/hifzer/srs/update";
import { db } from "@/lib/db";

type InputAttempt = {
  ayahId: number;
  stage: AttemptStage;
  grade: SrsGrade;
  createdAt: string;
};

type Payload = {
  localDate?: unknown;
  startedAt?: unknown;
  endedAt?: unknown;
  queue?: {
    warmupIds?: unknown;
    reviewIds?: unknown;
    newStartAyahId?: unknown;
    newEndAyahId?: unknown;
  };
  attempts?: unknown;
};

function parseArrayOfNumbers(input: unknown): number[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const out: number[] = [];
  for (const item of input) {
    const n = Number(item);
    if (Number.isFinite(n)) {
      out.push(n);
    }
  }
  return out;
}

function normalizeAttempts(input: unknown): InputAttempt[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const out: InputAttempt[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const raw = item as Record<string, unknown>;
    const ayahId = Number(raw.ayahId);
    const stage = String(raw.stage) as AttemptStage;
    const grade = String(raw.grade) as SrsGrade;
    const createdAt = String(raw.createdAt ?? "");

    if (!Number.isFinite(ayahId) || !createdAt) {
      continue;
    }
    if (!["WARMUP", "REVIEW", "NEW", "LINK"].includes(stage)) {
      continue;
    }
    if (!["AGAIN", "HARD", "GOOD", "EASY"].includes(grade)) {
      continue;
    }
    out.push({ ayahId, stage, grade, createdAt });
  }
  return out;
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
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const localDate = String(payload.localDate ?? "");
  const startedAt = new Date(String(payload.startedAt ?? ""));
  const endedAt = new Date(String(payload.endedAt ?? ""));
  if (!localDate || Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    return NextResponse.json({ error: "Missing localDate, startedAt, or endedAt" }, { status: 400 });
  }

  const attempts = normalizeAttempts(payload.attempts);
  if (!attempts.length) {
    return NextResponse.json({ error: "No attempts to sync" }, { status: 400 });
  }

  const profile = await getOrCreateUserProfile(userId);
  if (!profile) {
    return NextResponse.json({ ok: false, reason: "Database not configured" }, { status: 200 });
  }

  const warmupAyahIds = parseArrayOfNumbers(payload.queue?.warmupIds);
  const reviewAyahIds = parseArrayOfNumbers(payload.queue?.reviewIds);
  const newStartAyahId = Number(payload.queue?.newStartAyahId);
  const newEndAyahId = Number(payload.queue?.newEndAyahId);

  const prisma = db();

  const alreadySynced = await prisma.session.findFirst({
    where: { userId: profile.id, startedAt },
    select: { id: true },
  });

  if (alreadySynced) {
    return NextResponse.json({ ok: true, sessionId: alreadySynced.id, skipped: true });
  }

  const created = await prisma.session.create({
    data: {
      userId: profile.id,
      status: "COMPLETED",
      localDate,
      startedAt,
      endedAt,
      warmupAyahIds,
      reviewAyahIds,
      newStartAyahId: Number.isFinite(newStartAyahId) ? newStartAyahId : null,
      newEndAyahId: Number.isFinite(newEndAyahId) ? newEndAyahId : null,
    },
  });

  await prisma.ayahAttempt.createMany({
    data: attempts.map((attempt) => ({
      userId: profile.id,
      sessionId: created.id,
      ayahId: attempt.ayahId,
      stage: attempt.stage,
      grade: attempt.grade,
      createdAt: new Date(attempt.createdAt),
    })),
  });

  // Keep review updates deterministic by processing attempts in chronological order.
  const gradedAttempts = attempts
    .filter((attempt) => attempt.stage !== "LINK")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const touchedAyahIds = Array.from(new Set(gradedAttempts.map((a) => a.ayahId)));
  const existing = await prisma.ayahReview.findMany({
    where: { userId: profile.id, ayahId: { in: touchedAyahIds } },
  });
  const stateByAyahId = new Map<number, (typeof existing)[number]>();
  for (const row of existing) {
    stateByAyahId.set(row.ayahId, row);
  }

  for (const attempt of gradedAttempts) {
    const now = new Date(attempt.createdAt);
    const current = stateByAyahId.get(attempt.ayahId);

    const next = applyGrade(
      current
        ? {
            ayahId: current.ayahId,
            station: current.station,
            intervalDays: current.intervalDays,
            easeFactor: current.easeFactor,
            repetitions: current.repetitions,
            lapses: current.lapses,
            nextReviewAt: current.nextReviewAt,
            lastReviewAt: current.lastReviewAt ?? undefined,
            lastGrade: (current.lastGrade ?? undefined) as SrsGrade | undefined,
          }
        : defaultReviewState(attempt.ayahId, now),
      attempt.grade,
      now,
    );

    const upserted = await prisma.ayahReview.upsert({
      where: {
        userId_ayahId: {
          userId: profile.id,
          ayahId: attempt.ayahId,
        },
      },
      create: {
        userId: profile.id,
        ayahId: attempt.ayahId,
        station: next.station,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        repetitions: next.repetitions,
        lapses: next.lapses,
        nextReviewAt: next.nextReviewAt,
        lastReviewAt: next.lastReviewAt ?? null,
        lastGrade: next.lastGrade ?? null,
      },
      update: {
        station: next.station,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        repetitions: next.repetitions,
        lapses: next.lapses,
        nextReviewAt: next.nextReviewAt,
        lastReviewAt: next.lastReviewAt ?? null,
        lastGrade: next.lastGrade ?? null,
      },
    });
    stateByAyahId.set(attempt.ayahId, upserted);
  }

  return NextResponse.json({ ok: true, sessionId: created.id, syncedAttempts: attempts.length });
}

