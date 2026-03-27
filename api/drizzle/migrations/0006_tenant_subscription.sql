-- Add subscription fields to tenants
-- Plan/status are kept simple and can be extended later.

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_plan" text NOT NULL DEFAULT 'FREE';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_status" text NOT NULL DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_start" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_end" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_seats" integer NOT NULL DEFAULT 0;--> statement-breakpoint
