-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'PAUSED', 'CANCELED');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "paddleCustomerId" TEXT,
ADD COLUMN     "paddleSubscriptionId" TEXT,
ADD COLUMN     "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus";

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_paddleCustomerId_key" ON "UserProfile"("paddleCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_paddleSubscriptionId_key" ON "UserProfile"("paddleSubscriptionId");

