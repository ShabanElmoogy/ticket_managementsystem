ALTER TABLE "notifications" ADD COLUMN "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_tenant_id_idx" ON "notifications" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" ("is_read");
