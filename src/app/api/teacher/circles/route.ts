import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  addTeacherCircleMember,
  createTeacherCircle,
  saveTeacherCircleWeeklyCheck,
} from "@/hifzer/circles/server";

export const runtime = "nodejs";

type Payload = {
  intent?: unknown;
  circleId?: unknown;
  name?: unknown;
  kind?: unknown;
  description?: unknown;
  leadName?: unknown;
  displayName?: unknown;
  role?: unknown;
  notes?: unknown;
  memberId?: unknown;
  weekStartLocalDate?: unknown;
  targetLabel?: unknown;
  targetStartRef?: unknown;
  targetEndRef?: unknown;
  attendanceStatus?: unknown;
  oralCheckStatus?: unknown;
  teacherComment?: unknown;
  parentComment?: unknown;
};

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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

  const intent = stringValue(payload.intent);
  if (!intent) {
    return NextResponse.json({ error: "intent is required" }, { status: 400 });
  }

  try {
    if (intent === "create_circle") {
      const name = stringValue(payload.name);
      const kind = stringValue(payload.kind);
      if (!name || (kind !== "HALAQAH" && kind !== "FAMILY")) {
        return NextResponse.json({ error: "name and kind are required" }, { status: 400 });
      }
      const hub = await createTeacherCircle(userId, {
        name,
        kind,
        description: stringValue(payload.description),
        leadName: stringValue(payload.leadName),
      });
      return NextResponse.json({ ok: true, hub });
    }

    if (intent === "add_member") {
      const circleId = stringValue(payload.circleId);
      const displayName = stringValue(payload.displayName);
      const role = stringValue(payload.role);
      if (!circleId || !displayName || !role || !["LEAD", "TEACHER", "PARENT", "STUDENT"].includes(role)) {
        return NextResponse.json({ error: "circleId, displayName, and role are required" }, { status: 400 });
      }
      const hub = await addTeacherCircleMember(userId, {
        circleId,
        displayName,
        role: role as "LEAD" | "TEACHER" | "PARENT" | "STUDENT",
        notes: stringValue(payload.notes),
      });
      return NextResponse.json({ ok: true, hub });
    }

    if (intent === "save_weekly_check") {
      const circleId = stringValue(payload.circleId);
      const memberId = stringValue(payload.memberId);
      const weekStartLocalDate = stringValue(payload.weekStartLocalDate);
      const targetLabel = stringValue(payload.targetLabel);
      const attendanceStatus = stringValue(payload.attendanceStatus);
      const oralCheckStatus = stringValue(payload.oralCheckStatus);
      if (
        !circleId
        || !memberId
        || !weekStartLocalDate
        || !targetLabel
        || !attendanceStatus
        || !oralCheckStatus
        || !["PENDING", "ATTENDED", "MISSED", "EXCUSED"].includes(attendanceStatus)
        || !["PENDING", "PASS", "REVIEW_NEEDED", "ABSENT"].includes(oralCheckStatus)
      ) {
        return NextResponse.json({ error: "Weekly check fields are incomplete" }, { status: 400 });
      }

      const hub = await saveTeacherCircleWeeklyCheck(userId, {
        circleId,
        memberId,
        weekStartLocalDate,
        targetLabel,
        targetStartRef: stringValue(payload.targetStartRef),
        targetEndRef: stringValue(payload.targetEndRef),
        attendanceStatus: attendanceStatus as "PENDING" | "ATTENDED" | "MISSED" | "EXCUSED",
        oralCheckStatus: oralCheckStatus as "PENDING" | "PASS" | "REVIEW_NEEDED" | "ABSENT",
        teacherComment: stringValue(payload.teacherComment),
        parentComment: stringValue(payload.parentComment),
      });
      return NextResponse.json({ ok: true, hub });
    }

    return NextResponse.json({ error: "Unsupported intent" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update circles.";
    if (/does not exist|relation|column|P2021|P2022/i.test(message)) {
      return NextResponse.json({ error: "Circle schema not ready. Run the latest migration." }, { status: 503 });
    }
    if (/unique/i.test(message)) {
      return NextResponse.json({ error: "That member already exists in the circle." }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
