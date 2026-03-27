-- Add tenant_id in a safe way for existing data:
-- 1) add as NULLable
-- 2) backfill from existing relations
-- 3) enforce NOT NULL
-- 4) add FK constraints

ALTER TABLE "board_permissions" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "kanban_boards" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "kanban_columns" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint

-- Backfill tenant_id
-- board_permissions -> kanban_boards (via board_id)
UPDATE "board_permissions" bp
SET "tenant_id" = kb."tenant_id"
FROM "kanban_boards" kb
WHERE bp."board_id" = kb."id"
  AND bp."tenant_id" IS NULL;--> statement-breakpoint

-- kanban_columns -> kanban_boards (via board_id)
UPDATE "kanban_columns" kc
SET "tenant_id" = kb."tenant_id"
FROM "kanban_boards" kb
WHERE kc."board_id" = kb."id"
  AND kc."tenant_id" IS NULL;--> statement-breakpoint

-- If there is exactly one tenant in the system, use it as a fallback for any remaining NULLs.
UPDATE "kanban_boards"
SET "tenant_id" = (SELECT id FROM "tenants" LIMIT 1)
WHERE "tenant_id" IS NULL
  AND (SELECT COUNT(*) FROM "tenants") = 1;--> statement-breakpoint

UPDATE "kanban_columns"
SET "tenant_id" = (SELECT id FROM "tenants" LIMIT 1)
WHERE "tenant_id" IS NULL
  AND (SELECT COUNT(*) FROM "tenants") = 1;--> statement-breakpoint

UPDATE "board_permissions"
SET "tenant_id" = (SELECT id FROM "tenants" LIMIT 1)
WHERE "tenant_id" IS NULL
  AND (SELECT COUNT(*) FROM "tenants") = 1;--> statement-breakpoint

-- Enforce NOT NULL (will fail with a clear error if any rows still have NULL tenant_id)
ALTER TABLE "kanban_boards" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "board_permissions" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint

-- Add FK constraints
ALTER TABLE "board_permissions" ADD CONSTRAINT "board_permissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_boards" ADD CONSTRAINT "kanban_boards_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
