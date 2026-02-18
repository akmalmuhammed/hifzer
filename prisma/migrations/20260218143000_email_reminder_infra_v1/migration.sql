-- Email reminder infrastructure: reminder preferences + idempotent dispatch ledger.

-- CreateEnum
CREATE TYPE "EmailDispatchStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'DRY_RUN');

-- AlterTable
ALTER TABLE "UserProfile"
ADD COLUMN "emailRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "emailSuppressedAt" TIMESTAMP(3),
ADD COLUMN "emailUnsubscribedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailDispatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "status" "EmailDispatchStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailDispatch_userId_templateKey_localDate_key" ON "EmailDispatch"("userId", "templateKey", "localDate");

-- CreateIndex
CREATE INDEX "EmailDispatch_localDate_status_idx" ON "EmailDispatch"("localDate", "status");

-- CreateIndex
CREATE INDEX "EmailDispatch_userId_createdAt_idx" ON "EmailDispatch"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "EmailDispatch" ADD CONSTRAINT "EmailDispatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
