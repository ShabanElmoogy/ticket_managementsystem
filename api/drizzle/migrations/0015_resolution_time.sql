ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "resolved_at" timestamp;

UPDATE "tickets" SET "resolved_at" = "updated_at" WHERE "status" IN ('RESOLVED', 'CLOSED') AND "resolved_at" IS NULL;
