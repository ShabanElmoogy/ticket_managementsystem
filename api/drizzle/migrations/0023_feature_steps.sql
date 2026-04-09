CREATE TYPE "public"."feature_step_status" AS ENUM('TODO', 'IN_PROGRESS', 'DONE');

CREATE TABLE "feature_steps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "feature_request_id" uuid NOT NULL REFERENCES "feature_requests"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "order" integer NOT NULL DEFAULT 0,
  "status" "feature_step_status" NOT NULL DEFAULT 'TODO',
  "assigned_to_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "assigned_programmer_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "linked_ticket_id" uuid REFERENCES "tickets"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
