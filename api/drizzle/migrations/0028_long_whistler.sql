CREATE TABLE "epic_dependencies" (
	"epic_id" uuid NOT NULL,
	"blocker_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "epic_dependencies" ADD CONSTRAINT "epic_dependencies_epic_id_epics_id_fk" FOREIGN KEY ("epic_id") REFERENCES "public"."epics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epic_dependencies" ADD CONSTRAINT "epic_dependencies_blocker_id_epics_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."epics"("id") ON DELETE cascade ON UPDATE no action;