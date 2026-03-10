import type {
  CircleAttendanceStatus,
  CircleKind,
  CircleMemberRole,
  CircleOralCheckStatus,
} from "@prisma/client";

export type CircleWeeklyCheckSnapshot = {
  id: string;
  weekStartLocalDate: string;
  targetLabel: string;
  targetStartRef: string | null;
  targetEndRef: string | null;
  attendanceStatus: CircleAttendanceStatus;
  oralCheckStatus: CircleOralCheckStatus;
  teacherComment: string | null;
  parentComment: string | null;
  updatedAt: string;
};

export type CircleMemberSnapshot = {
  id: string;
  displayName: string;
  role: CircleMemberRole;
  notes: string | null;
  linkedClerkUserId: string | null;
  currentWeekCheck: CircleWeeklyCheckSnapshot | null;
};

export type TeacherCircleSnapshot = {
  id: string;
  name: string;
  kind: CircleKind;
  description: string | null;
  memberCount: number;
  attendanceCount: number;
  reviewNeededCount: number;
  members: CircleMemberSnapshot[];
};

export type TeacherCircleHub = {
  schemaReady: boolean;
  weekStartLocalDate: string;
  circles: TeacherCircleSnapshot[];
};
