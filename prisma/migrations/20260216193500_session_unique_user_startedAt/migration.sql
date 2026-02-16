-- Clean up duplicate sync rows before introducing uniqueness.
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "startedAt"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS "rn"
  FROM "Session"
)
DELETE FROM "Session" s
USING ranked r
WHERE s."id" = r."id"
  AND r."rn" > 1;

-- Enforce idempotent sync per user + session start timestamp.
CREATE UNIQUE INDEX IF NOT EXISTS "Session_userId_startedAt_key"
ON "Session"("userId", "startedAt");
