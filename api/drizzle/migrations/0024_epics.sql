CREATE TYPE "public"."epic_status" AS ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE "epics" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title"          text NOT NULL,
  "description"    text,
  "status"         "epic_status" NOT NULL DEFAULT 'DRAFT',
  "tenant_id"      uuid REFERENCES "tenants"("id") ON DELETE CASCADE,
  "owner_id"       uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "application_id" uuid REFERENCES "applications"("id") ON DELETE SET NULL,
  "customer_id"    uuid REFERENCES "customers"("id") ON DELETE SET NULL,
  "target_date"    date,
  "created_at"     timestamp DEFAULT now(),
  "updated_at"     timestamp DEFAULT now()
);

ALTER TABLE "feature_requests"
  ADD COLUMN "epic_id" uuid REFERENCES "epics"("id") ON DELETE SET NULL;
