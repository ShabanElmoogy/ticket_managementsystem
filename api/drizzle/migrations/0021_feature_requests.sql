CREATE TYPE "public"."feature_status" AS ENUM('UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED');

CREATE TABLE "feature_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "status" "feature_status" NOT NULL DEFAULT 'UNDER_REVIEW',
  "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE,
  "submitted_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "linked_ticket_id" uuid REFERENCES "tickets"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE "feature_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "feature_request_id" uuid NOT NULL REFERENCES "feature_requests"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "feature_votes_feature_request_id_user_id_unique" UNIQUE("feature_request_id", "user_id")
);
