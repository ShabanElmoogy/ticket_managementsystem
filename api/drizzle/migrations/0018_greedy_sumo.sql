ALTER TABLE "tickets" ADD COLUMN "sla_deadline" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "sla_urgent_hours" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "sla_high_hours" integer DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "sla_medium_hours" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "sla_low_hours" integer DEFAULT 72 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "is_active";