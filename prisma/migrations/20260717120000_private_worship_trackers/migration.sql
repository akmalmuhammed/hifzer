DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PrayerName') THEN
    CREATE TYPE "PrayerName" AS ENUM ('FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PrayerCheckInStatus') THEN
    CREATE TYPE "PrayerCheckInStatus" AS ENUM ('ON_TIME', 'LATER', 'EXCUSED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FastingStatus') THEN
    CREATE TYPE "FastingStatus" AS ENUM ('FASTING', 'COMPLETED', 'NOT_FASTING', 'EXEMPT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FastingKind') THEN
    CREATE TYPE "FastingKind" AS ENUM ('RAMADAN', 'MAKE_UP', 'VOLUNTARY', 'OTHER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ZakatPlanStatus') THEN
    CREATE TYPE "ZakatPlanStatus" AS ENUM ('DRAFT', 'READY', 'PARTIALLY_PAID', 'PAID');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PrayerCheckIn" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "prayer" "PrayerName" NOT NULL,
  "status" "PrayerCheckInStatus" NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrayerCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FastingCheckIn" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "status" "FastingStatus" NOT NULL,
  "kind" "FastingKind",
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FastingCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ZakatPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "periodYear" INTEGER NOT NULL,
  "dueDate" TEXT,
  "status" "ZakatPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "secretCiphertext" TEXT NOT NULL,
  "encryptionVersion" INTEGER NOT NULL DEFAULT 1,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ZakatPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ZakatPayment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "zakatPlanId" TEXT NOT NULL,
  "paidOn" TEXT NOT NULL,
  "clientMutationId" TEXT NOT NULL,
  "secretCiphertext" TEXT NOT NULL,
  "encryptionVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ZakatPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrayerCheckIn_userId_localDate_prayer_key"
ON "PrayerCheckIn"("userId", "localDate", "prayer");
CREATE INDEX IF NOT EXISTS "PrayerCheckIn_userId_localDate_idx"
ON "PrayerCheckIn"("userId", "localDate");

CREATE UNIQUE INDEX IF NOT EXISTS "FastingCheckIn_userId_localDate_key"
ON "FastingCheckIn"("userId", "localDate");
CREATE INDEX IF NOT EXISTS "FastingCheckIn_userId_localDate_idx"
ON "FastingCheckIn"("userId", "localDate");

CREATE UNIQUE INDEX IF NOT EXISTS "ZakatPlan_userId_periodYear_key"
ON "ZakatPlan"("userId", "periodYear");
CREATE INDEX IF NOT EXISTS "ZakatPlan_userId_updatedAt_idx"
ON "ZakatPlan"("userId", "updatedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "ZakatPayment_userId_clientMutationId_key"
ON "ZakatPayment"("userId", "clientMutationId");
CREATE INDEX IF NOT EXISTS "ZakatPayment_userId_paidOn_idx"
ON "ZakatPayment"("userId", "paidOn");
CREATE INDEX IF NOT EXISTS "ZakatPayment_zakatPlanId_paidOn_idx"
ON "ZakatPayment"("zakatPlanId", "paidOn");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrayerCheckIn_userId_fkey') THEN
    ALTER TABLE "PrayerCheckIn"
      ADD CONSTRAINT "PrayerCheckIn_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FastingCheckIn_userId_fkey') THEN
    ALTER TABLE "FastingCheckIn"
      ADD CONSTRAINT "FastingCheckIn_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ZakatPlan_userId_fkey') THEN
    ALTER TABLE "ZakatPlan"
      ADD CONSTRAINT "ZakatPlan_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ZakatPayment_userId_fkey') THEN
    ALTER TABLE "ZakatPayment"
      ADD CONSTRAINT "ZakatPayment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ZakatPayment_zakatPlanId_fkey') THEN
    ALTER TABLE "ZakatPayment"
      ADD CONSTRAINT "ZakatPayment_zakatPlanId_fkey"
      FOREIGN KEY ("zakatPlanId") REFERENCES "ZakatPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
