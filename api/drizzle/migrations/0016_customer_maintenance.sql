CREATE TYPE "maintenance_type" AS ENUM ('MONTHLY_SUBSCRIPTION', 'FREE_TRIAL', 'PAY_AS_YOU_GO');

ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "maintenance_type" "maintenance_type",
  ADD COLUMN IF NOT EXISTS "subscription_start_date" timestamp,
  ADD COLUMN IF NOT EXISTS "subscription_end_date" timestamp;
