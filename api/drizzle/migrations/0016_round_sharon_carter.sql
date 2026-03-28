CREATE TYPE "public"."maintenance_type" AS ENUM('MONTHLY_SUBSCRIPTION', 'FREE_TRIAL', 'PAY_AS_YOU_GO');--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "maintenance_type" "maintenance_type";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "subscription_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "subscription_end_date" timestamp;