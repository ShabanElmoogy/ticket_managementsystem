ALTER TABLE "tickets" ADD COLUMN "email_message_id" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "email_from" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "support_email" text;