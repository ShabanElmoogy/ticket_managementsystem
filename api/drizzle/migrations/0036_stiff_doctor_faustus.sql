CREATE TYPE "public"."epic_relation_type" AS ENUM('RELATES_TO', 'DUPLICATES', 'DEPENDS_ON', 'SPLIT_FROM');--> statement-breakpoint
CREATE TABLE "epic_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_epic_id" uuid NOT NULL,
	"target_epic_id" uuid NOT NULL,
	"relation_type" "epic_relation_type" DEFAULT 'RELATES_TO' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "epic_relations" ADD CONSTRAINT "epic_relations_source_epic_id_epics_id_fk" FOREIGN KEY ("source_epic_id") REFERENCES "public"."epics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epic_relations" ADD CONSTRAINT "epic_relations_target_epic_id_epics_id_fk" FOREIGN KEY ("target_epic_id") REFERENCES "public"."epics"("id") ON DELETE cascade ON UPDATE no action;