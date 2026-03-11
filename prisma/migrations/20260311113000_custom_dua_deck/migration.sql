CREATE TABLE "CustomDua" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL DEFAULT 'laylat-al-qadr',
  "title" TEXT NOT NULL,
  "arabic" TEXT,
  "transliteration" TEXT,
  "translation" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomDua_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DuaDeckOrder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL DEFAULT 'laylat-al-qadr',
  "itemKey" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DuaDeckOrder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CustomDua"
ADD CONSTRAINT "CustomDua_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DuaDeckOrder"
ADD CONSTRAINT "DuaDeckOrder_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CustomDua_userId_moduleId_updatedAt_idx" ON "CustomDua"("userId", "moduleId", "updatedAt");
CREATE INDEX "CustomDua_userId_moduleId_createdAt_idx" ON "CustomDua"("userId", "moduleId", "createdAt");
CREATE UNIQUE INDEX "DuaDeckOrder_userId_moduleId_itemKey_key" ON "DuaDeckOrder"("userId", "moduleId", "itemKey");
CREATE INDEX "DuaDeckOrder_userId_moduleId_sortOrder_updatedAt_idx" ON "DuaDeckOrder"("userId", "moduleId", "sortOrder", "updatedAt");
