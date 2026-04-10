CREATE TYPE "public"."epic_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
ALTER TABLE "epics" ADD COLUMN "priority" "epic_priority" DEFAULT 'MEDIUM' NOT NULL;