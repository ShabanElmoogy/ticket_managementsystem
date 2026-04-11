CREATE TABLE "epic_watchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"epic_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "epic_watchers_epic_id_user_id_unique" UNIQUE("epic_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "epic_watchers" ADD CONSTRAINT "epic_watchers_epic_id_epics_id_fk" FOREIGN KEY ("epic_id") REFERENCES "public"."epics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epic_watchers" ADD CONSTRAINT "epic_watchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;