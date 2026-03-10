import "server-only";

import type {
  CircleAttendanceStatus,
  CircleKind,
  CircleMemberRole,
  CircleOralCheckStatus,
} from "@prisma/client";
import { addIsoDaysUtc, isoDateToUtcMidnightMs } from "@/hifzer/derived/dates";
import { isoDateInTimeZone } from "@/hifzer/engine/date";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { ayahIdFromVerseRef, getAyahById } from "@/hifzer/quran/lookup.server";
import type { TeacherCircleHub, CircleMemberSnapshot } from "@/hifzer/circles/types";
import { db } from "@/lib/db";

function looksLikeMissingCircleSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("TeacherCircle") ||
    message.includes("TeacherCircleMember") ||
    message.includes("TeacherCircleWeeklyCheck") ||
    message.includes("CircleKind") ||
    message.includes("CircleMemberRole") ||
    message.includes("CircleAttendanceStatus") ||
    message.includes("CircleOralCheckStatus") ||
    message.includes("P2021") ||
    message.includes("P2022") ||
    /column .* does not exist/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

function verseRefLabel(ayahId: number | null | undefined): string | null {
  if (!ayahId) {
    return null;
  }
  const ayah = getAyahById(ayahId);
  if (!ayah) {
    return null;
  }
  return `${ayah.surahNumber}:${ayah.ayahNumber}`;
}

export function weekStartFromLocalDate(localDate: string): string {
  const baseMs = isoDateToUtcMidnightMs(localDate);
  if (!baseMs) {
    return localDate;
  }
  const weekday = new Date(baseMs).getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addIsoDaysUtc(localDate, offset);
}

async function requireOwnerProfile(clerkUserId: string) {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    throw new Error("Profile unavailable.");
  }
  return profile;
}

async function assertCircleOwnership(ownerUserId: string, circleId: string) {
  const circle = await db().teacherCircle.findFirst({
    where: {
      id: circleId,
      ownerUserId,
    },
    select: { id: true },
  });
  if (!circle) {
    throw new Error("Circle not found.");
  }
}

function parseVerseRef(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const match = /^(\d+):(\d+)$/.exec(value.trim());
  if (!match) {
    throw new Error("Verse reference must use surah:ayah format.");
  }
  const surahNumber = Number(match[1]);
  const ayahNumber = Number(match[2]);
  return ayahIdFromVerseRef({ surahNumber, ayahNumber });
}

export async function listTeacherCircleHub(clerkUserId: string): Promise<TeacherCircleHub | null> {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return null;
  }

  const weekStartLocalDate = weekStartFromLocalDate(isoDateInTimeZone(new Date(), profile.timezone));

  try {
    const circles = await db().teacherCircle.findMany({
      where: { ownerUserId: profile.id },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        members: {
          orderBy: [{ role: "asc" }, { displayName: "asc" }],
          include: {
            linkedUser: {
              select: {
                clerkUserId: true,
              },
            },
            weeklyChecks: {
              where: { weekStartLocalDate },
              orderBy: { updatedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    return {
      schemaReady: true,
      weekStartLocalDate,
      circles: circles.map((circle) => {
        let attendanceCount = 0;
        let reviewNeededCount = 0;
        const members: CircleMemberSnapshot[] = circle.members.map((member) => {
          const check = member.weeklyChecks[0] ?? null;
          if (check?.attendanceStatus === "ATTENDED") {
            attendanceCount += 1;
          }
          if (check?.oralCheckStatus === "REVIEW_NEEDED") {
            reviewNeededCount += 1;
          }
          return {
            id: member.id,
            displayName: member.displayName,
            role: member.role,
            notes: member.notes ?? null,
            linkedClerkUserId: member.linkedUser?.clerkUserId ?? null,
            currentWeekCheck: check
              ? {
                id: check.id,
                weekStartLocalDate: check.weekStartLocalDate,
                targetLabel: check.targetLabel,
                targetStartRef: verseRefLabel(check.targetStartAyahId),
                targetEndRef: verseRefLabel(check.targetEndAyahId),
                attendanceStatus: check.attendanceStatus,
                oralCheckStatus: check.oralCheckStatus,
                teacherComment: check.teacherComment ?? null,
                parentComment: check.parentComment ?? null,
                updatedAt: check.updatedAt.toISOString(),
              }
              : null,
          };
        });

        return {
          id: circle.id,
          name: circle.name,
          kind: circle.kind,
          description: circle.description ?? null,
          memberCount: members.length,
          attendanceCount,
          reviewNeededCount,
          members,
        };
      }),
    };
  } catch (error) {
    if (looksLikeMissingCircleSchema(error)) {
      return {
        schemaReady: false,
        weekStartLocalDate,
        circles: [],
      };
    }
    throw error;
  }
}

export async function createTeacherCircle(
  clerkUserId: string,
  input: { name: string; kind: CircleKind; description?: string | null; leadName?: string | null },
): Promise<TeacherCircleHub | null> {
  const profile = await requireOwnerProfile(clerkUserId);
  const name = input.name.trim();
  if (!name) {
    throw new Error("Circle name is required.");
  }

  await db().teacherCircle.create({
    data: {
      ownerUserId: profile.id,
      name,
      kind: input.kind,
      description: input.description?.trim() || null,
      members: {
        create: {
          displayName: input.leadName?.trim() || "Supervisor",
          role: "LEAD",
          linkedUserId: profile.id,
        },
      },
    },
  });

  return listTeacherCircleHub(clerkUserId);
}

export async function addTeacherCircleMember(
  clerkUserId: string,
  input: { circleId: string; displayName: string; role: CircleMemberRole; notes?: string | null },
): Promise<TeacherCircleHub | null> {
  const profile = await requireOwnerProfile(clerkUserId);
  const displayName = input.displayName.trim();
  if (!displayName) {
    throw new Error("Member name is required.");
  }
  await assertCircleOwnership(profile.id, input.circleId);

  await db().teacherCircleMember.create({
    data: {
      circleId: input.circleId,
      displayName,
      role: input.role,
      notes: input.notes?.trim() || null,
    },
  });

  return listTeacherCircleHub(clerkUserId);
}

export async function saveTeacherCircleWeeklyCheck(
  clerkUserId: string,
  input: {
    circleId: string;
    memberId: string;
    weekStartLocalDate: string;
    targetLabel: string;
    targetStartRef?: string | null;
    targetEndRef?: string | null;
    attendanceStatus: CircleAttendanceStatus;
    oralCheckStatus: CircleOralCheckStatus;
    teacherComment?: string | null;
    parentComment?: string | null;
  },
): Promise<TeacherCircleHub | null> {
  const profile = await requireOwnerProfile(clerkUserId);
  await assertCircleOwnership(profile.id, input.circleId);

  const targetLabel = input.targetLabel.trim();
  if (!targetLabel) {
    throw new Error("Weekly target is required.");
  }

  const targetStartAyahId = parseVerseRef(input.targetStartRef ?? null);
  const targetEndAyahId = parseVerseRef(input.targetEndRef ?? null);

  await db().teacherCircleWeeklyCheck.upsert({
    where: {
      memberId_weekStartLocalDate: {
        memberId: input.memberId,
        weekStartLocalDate: input.weekStartLocalDate,
      },
    },
    create: {
      circleId: input.circleId,
      memberId: input.memberId,
      weekStartLocalDate: input.weekStartLocalDate,
      targetLabel,
      targetStartAyahId,
      targetEndAyahId,
      attendanceStatus: input.attendanceStatus,
      oralCheckStatus: input.oralCheckStatus,
      teacherComment: input.teacherComment?.trim() || null,
      parentComment: input.parentComment?.trim() || null,
      updatedByUserId: profile.id,
    },
    update: {
      targetLabel,
      targetStartAyahId,
      targetEndAyahId,
      attendanceStatus: input.attendanceStatus,
      oralCheckStatus: input.oralCheckStatus,
      teacherComment: input.teacherComment?.trim() || null,
      parentComment: input.parentComment?.trim() || null,
      updatedByUserId: profile.id,
    },
  });

  return listTeacherCircleHub(clerkUserId);
}
