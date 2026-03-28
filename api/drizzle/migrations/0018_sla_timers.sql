ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "sla_urgent_hours" integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS "sla_high_hours" integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "sla_medium_hours" integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "sla_low_hours" integer NOT NULL DEFAULT 72;

ALTER TABLE "tickets"
  ADD COLUMN IF NOT EXISTS "sla_deadline" timestamp;
