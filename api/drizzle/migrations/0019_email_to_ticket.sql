ALTER TABLE "tickets"
  ADD COLUMN IF NOT EXISTS "email_message_id" text,
  ADD COLUMN IF NOT EXISTS "email_from" text;

CREATE UNIQUE INDEX IF NOT EXISTS "tickets_email_message_id_idx" ON "tickets" ("email_message_id") WHERE "email_message_id" IS NOT NULL;
