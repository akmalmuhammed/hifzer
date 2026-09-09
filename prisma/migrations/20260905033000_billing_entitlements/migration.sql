-- CreateEnum
CREATE TYPE "BillingEntitlementKind" AS ENUM ('PREMIUM_LIFETIME');

-- CreateEnum
CREATE TYPE "BillingEntitlementStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "BillingEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'paddle',
    "providerTransactionId" TEXT NOT NULL,
    "kind" "BillingEntitlementKind" NOT NULL DEFAULT 'PREMIUM_LIFETIME',
    "status" "BillingEntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingEntitlement_providerTransactionId_key"
ON "BillingEntitlement"("providerTransactionId");

-- CreateIndex
CREATE INDEX "BillingEntitlement_userId_status_idx"
ON "BillingEntitlement"("userId", "status");

-- AddForeignKey
ALTER TABLE "BillingEntitlement"
ADD CONSTRAINT "BillingEntitlement_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
