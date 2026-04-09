ALTER TABLE "feature_requests"
  ADD COLUMN "application_id" uuid REFERENCES "applications"("id") ON DELETE SET NULL,
  ADD COLUMN "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL;
