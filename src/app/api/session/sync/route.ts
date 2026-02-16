import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { applyGrade, defaultReviewState } from "@/hifzer/srs/update";
import { db } from "@/lib/db";

const ATTEMPT_STAGES = ["WARMUP", "REVIEW", "NEW", "LINK"] as const;
const SRS_GRADES = ["AGAIN", "HARD", "GOOD", "EASY"] as const;

type AttemptStageValue = (typeof ATTEMPT_STAGES)[number];
type SrsGradeValue = (typeof SRS_GRADES)[number];

type InputAttempt = {
  ayahId: number;
  stage: AttemptStageValue;
  grade: SrsGradeValue;
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

function isAttemptStageValue(value: string): value is AttemptStageValue {
  return ATTEMPT_STAGES.some((stage) => stage === value);
}

function isSrsGradeValue(value: string): value is SrsGradeValue {
  return SRS_GRADES.some((grade) => grade === value);
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
    const stageRaw = String(raw.stage ?? "").trim();
    const gradeRaw = String(raw.grade ?? "").trim();
    const createdAt = String(raw.createdAt ?? "");

    if (!Number.isFinite(ayahId) || !createdAt) {
      continue;
    }
    if (!isAttemptStageValue(stageRaw)) {
      continue;
    }
    if (!isSrsGradeValue(gradeRaw)) {
      continue;
    }
    out.push({ ayahId, stage: stageRaw, grade: gradeRaw, createdAt });
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

  const newAttemptAyahIds = attempts
    .filter((attempt) => attempt.stage === "NEW")
    .map((attempt) => attempt.ayahId);
  const cursorCandidates: number[] = [];
  if (newAttemptAyahIds.length) {
    cursorCandidates.push(Math.max(...newAttemptAyahIds) + 1);
  }
  if (Number.isFinite(newEndAyahId)) {
    cursorCandidates.push(newEndAyahId + 1);
  }
  const nextCursorAyahId = cursorCandidates.length ? Math.max(...cursorCandidates) : null;

  try {
    const syncResult = await prisma.$transaction(async (tx) => {
      const alreadySynced = await tx.session.findUnique({
        where: {
          userId_startedAt: {
            userId: profile.id,
            startedAt,
          },
        },
        select: { id: true },
      });

      if (alreadySynced) {
        return {
          sessionId: alreadySynced.id,
          skipped: true,
          syncedAttempts: 0,
        };
      }

      const created = await tx.session.create({
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

      await tx.ayahAttempt.createMany({
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

      if (gradedAttempts.length) {
        const touchedAyahIds = Array.from(new Set(gradedAttempts.map((a) => a.ayahId)));
        const existing = await tx.ayahReview.findMany({
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
                  lastGrade: current.lastGrade ?? undefined,
                }
              : defaultReviewState(attempt.ayahId, now),
            attempt.grade,
            now,
          );

          const upserted = await tx.ayahReview.upsert({
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
      }

      if (nextCursorAyahId && Number.isFinite(nextCursorAyahId)) {
        await tx.userProfile.updateMany({
          where: {
            id: profile.id,
            cursorAyahId: { lt: nextCursorAyahId },
          },
          data: {
            cursorAyahId: nextCursorAyahId,
          },
        });
      }

      return {
        sessionId: created.id,
        skipped: false,
        syncedAttempts: attempts.length,
      };
    });

    return NextResponse.json({
      ok: true,
      sessionId: syncResult.sessionId,
      skipped: syncResult.skipped,
      syncedAttempts: syncResult.syncedAttempts,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.session.findUnique({
        where: {
          userId_startedAt: {
            userId: profile.id,
            startedAt,
          },
        },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ ok: true, sessionId: existing.id, skipped: true, syncedAttempts: 0 });
      }
    }
    throw error;
  }
}
