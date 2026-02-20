-- Smart bookmarks v1: named bookmarks, categories, notes, and idempotent mutation ledger.

-- CreateEnum
CREATE TYPE "BookmarkMutationType" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'RESTORE',
    'CATEGORY_CREATE',
    'CATEGORY_UPDATE',
    'CATEGORY_DELETE'
);

-- CreateTable
CREATE TABLE "BookmarkCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookmarkCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ayahId" INTEGER NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "ayahNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "categoryId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookmarkEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookmarkId" TEXT,
    "mutationType" "BookmarkMutationType" NOT NULL,
    "clientMutationId" TEXT NOT NULL,
    "payloadJson" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookmarkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookmarkCategory_userId_updatedAt_idx" ON "BookmarkCategory"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "BookmarkCategory_userId_archivedAt_idx" ON "BookmarkCategory"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "Bookmark_userId_updatedAt_idx" ON "Bookmark"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Bookmark_userId_deletedAt_idx" ON "Bookmark"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Bookmark_userId_ayahId_idx" ON "Bookmark"("userId", "ayahId");

-- CreateIndex
CREATE INDEX "Bookmark_categoryId_idx" ON "Bookmark"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BookmarkEvent_userId_clientMutationId_key" ON "BookmarkEvent"("userId", "clientMutationId");

-- CreateIndex
CREATE INDEX "BookmarkEvent_userId_occurredAt_idx" ON "BookmarkEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "BookmarkEvent_bookmarkId_occurredAt_idx" ON "BookmarkEvent"("bookmarkId", "occurredAt");

-- AddForeignKey
ALTER TABLE "BookmarkCategory" ADD CONSTRAINT "BookmarkCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BookmarkCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkEvent" ADD CONSTRAINT "BookmarkEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkEvent" ADD CONSTRAINT "BookmarkEvent_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "Bookmark"("id") ON DELETE SET NULL ON UPDATE CASCADE;
