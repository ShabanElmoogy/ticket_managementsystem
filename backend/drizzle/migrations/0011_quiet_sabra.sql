ALTER TYPE "public"."activity_action" ADD VALUE 'PROGRAMMER_ASSIGNED';--> statement-breakpoint
ALTER TYPE "public"."activity_action" ADD VALUE 'PROGRAMMING_UPDATED';--> statement-breakpoint
ALTER TYPE "public"."ticket_status" ADD VALUE 'PROGRAMMING' BEFORE 'RESOLVED';--> statement-breakpoint
ALTER TYPE "public"."ticket_status" ADD VALUE 'UNDER_DEVELOPMENT' BEFORE 'RESOLVED';--> statement-breakpoint
ALTER TYPE "public"."ticket_status" ADD VALUE 'CODE_REVIEW' BEFORE 'RESOLVED';--> statement-breakpoint
ALTER TYPE "public"."ticket_status" ADD VALUE 'TESTING' BEFORE 'RESOLVED';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'PROGRAMMER';--> statement-breakpoint
CREATE TABLE "programming_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"programmer_id" uuid,
	"technical_description" text,
	"root_cause" text,
	"steps_to_reproduce" text,
	"solution_steps" jsonb DEFAULT '[]'::jsonb,
	"code_snippets" jsonb DEFAULT '[]'::jsonb,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"estimated_hours" real,
	"actual_hours" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "programming_details_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "programmer_id" uuid;--> statement-breakpoint
ALTER TABLE "programming_details" ADD CONSTRAINT "programming_details_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programming_details" ADD CONSTRAINT "programming_details_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programming_details" ADD CONSTRAINT "programming_details_programmer_id_users_id_fk" FOREIGN KEY ("programmer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_programmer_id_users_id_fk" FOREIGN KEY ("programmer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;