CREATE TYPE "public"."activity_action" AS ENUM('CREATED', 'UPDATED', 'ASSIGNED', 'COMMENTED', 'STATUS_CHANGED', 'PRIORITY_CHANGED');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."permission_role" AS ENUM('ADMIN', 'MEMBER', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'EMPLOYEE');--> statement-breakpoint
ALTER TABLE "customer_applications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "customer_applications" CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_board_id_kanban_boards_id_fk";
--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_board_id_kanban_boards_id_fk";
--> statement-breakpoint
DROP INDEX "board_permissions_user_id_board_id_idx";--> statement-breakpoint
DROP INDEX "customers_email_idx";--> statement-breakpoint
DROP INDEX "kanban_columns_board_id_position_idx";--> statement-breakpoint
DROP INDEX "labels_name_idx";--> statement-breakpoint
DROP INDEX "refresh_tokens_token_idx";--> statement-breakpoint
DROP INDEX "refresh_tokens_user_id_idx";--> statement-breakpoint
DROP INDEX "refresh_tokens_expires_at_idx";--> statement-breakpoint
DROP INDEX "refresh_tokens_revoked_at_idx";--> statement-breakpoint
DROP INDEX "ticket_labels_ticket_id_label_id_idx";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "version" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "board_permissions" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "board_permissions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "board_permissions" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "board_permissions" ALTER COLUMN "board_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "board_permissions" ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"public"."permission_role";--> statement-breakpoint
ALTER TABLE "board_permissions" ALTER COLUMN "role" SET DATA TYPE "public"."permission_role" USING "role"::"public"."permission_role";--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "ticket_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "phone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_boards" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "kanban_boards" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "kanban_boards" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "kanban_boards" ALTER COLUMN "is_default" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_boards" ALTER COLUMN "is_active" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_boards" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_boards" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "color" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "color" SET DEFAULT '#e3f2fd';--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "position" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "is_active" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kanban_columns" ALTER COLUMN "board_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "labels" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "labels" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "labels" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "labels" ALTER COLUMN "color" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "labels" ALTER COLUMN "color" SET DEFAULT '#3B82F6';--> statement-breakpoint
ALTER TABLE "labels" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "labels" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "is_read" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "ticket_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "token" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'TODO';--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "assignee_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "board_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "column_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ticket_activities" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ticket_activities" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "ticket_activities" ALTER COLUMN "action" SET DATA TYPE "public"."activity_action" USING "action"::"public"."activity_action";--> statement-breakpoint
ALTER TABLE "ticket_activities" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_activities" ALTER COLUMN "ticket_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ticket_activities" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ticket_labels" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ticket_labels" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "ticket_labels" ALTER COLUMN "ticket_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ticket_labels" ALTER COLUMN "label_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM'::"public"."ticket_priority";--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "priority" SET DATA TYPE "public"."ticket_priority" USING "priority"::"public"."ticket_priority";--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "assigned_to_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "created_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "customer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "application_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "board_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "whatsapp_notifications" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "whatsapp_notifications" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "reminder_enabled" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "reminder_interval" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "board_permissions" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "company" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" text DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_labels" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_board_id_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "due_date";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token");--> statement-breakpoint
DROP TYPE "public"."activity_type";--> statement-breakpoint
DROP TYPE "public"."board_permission_role";--> statement-breakpoint
DROP TYPE "public"."notification_type";--> statement-breakpoint
DROP TYPE "public"."priority";--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
DROP TYPE "public"."task_status";