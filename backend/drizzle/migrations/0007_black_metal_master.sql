ALTER TABLE "tenants" ADD COLUMN "subscription_plan" text DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "subscription_status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "subscription_start" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "subscription_end" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "subscription_seats" integer DEFAULT 0 NOT NULL;