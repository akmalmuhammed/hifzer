-- CreateEnum
CREATE TYPE "CircleKind" AS ENUM ('HALAQAH', 'FAMILY');

-- CreateEnum
CREATE TYPE "CircleMemberRole" AS ENUM ('LEAD', 'TEACHER', 'PARENT', 'STUDENT');

-- CreateEnum
CREATE TYPE "CircleAttendanceStatus" AS ENUM ('PENDING', 'ATTENDED', 'MISSED', 'EXCUSED');

-- CreateEnum
CREATE TYPE "CircleOralCheckStatus" AS ENUM ('PENDING', 'PASS', 'REVIEW_NEEDED', 'ABSENT');

-- CreateTable
CREATE TABLE "TeacherCircle" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CircleKind" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherCircle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherCircleMember" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "linkedUserId" TEXT,
    "displayName" TEXT NOT NULL,
    "role" "CircleMemberRole" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherCircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherCircleWeeklyCheck" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weekStartLocalDate" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "targetStartAyahId" INTEGER,
    "targetEndAyahId" INTEGER,
    "attendanceStatus" "CircleAttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "oralCheckStatus" "CircleOralCheckStatus" NOT NULL DEFAULT 'PENDING',
    "teacherComment" TEXT,
    "parentComment" TEXT,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherCircleWeeklyCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherCircle_ownerUserId_updatedAt_idx" ON "TeacherCircle"("ownerUserId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherCircleMember_circleId_displayName_key" ON "TeacherCircleMember"("circleId", "displayName");

-- CreateIndex
CREATE INDEX "TeacherCircleMember_circleId_role_idx" ON "TeacherCircleMember"("circleId", "role");

-- CreateIndex
CREATE INDEX "TeacherCircleMember_linkedUserId_idx" ON "TeacherCircleMember"("linkedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherCircleWeeklyCheck_memberId_weekStartLocalDate_key" ON "TeacherCircleWeeklyCheck"("memberId", "weekStartLocalDate");

-- CreateIndex
CREATE INDEX "TeacherCircleWeeklyCheck_circleId_weekStartLocalDate_idx" ON "TeacherCircleWeeklyCheck"("circleId", "weekStartLocalDate");

-- CreateIndex
CREATE INDEX "TeacherCircleWeeklyCheck_updatedByUserId_updatedAt_idx" ON "TeacherCircleWeeklyCheck"("updatedByUserId", "updatedAt");

-- AddForeignKey
ALTER TABLE "TeacherCircle" ADD CONSTRAINT "TeacherCircle_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherCircleMember" ADD CONSTRAINT "TeacherCircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "TeacherCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherCircleMember" ADD CONSTRAINT "TeacherCircleMember_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherCircleWeeklyCheck" ADD CONSTRAINT "TeacherCircleWeeklyCheck_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "TeacherCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherCircleWeeklyCheck" ADD CONSTRAINT "TeacherCircleWeeklyCheck_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeacherCircleMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherCircleWeeklyCheck" ADD CONSTRAINT "TeacherCircleWeeklyCheck_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
