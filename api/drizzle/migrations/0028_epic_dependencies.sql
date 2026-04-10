CREATE TABLE IF NOT EXISTS "epic_dependencies" (
  "epic_id"    uuid NOT NULL REFERENCES "epics"("id") ON DELETE CASCADE,
  "blocker_id" uuid NOT NULL REFERENCES "epics"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now(),
  PRIMARY KEY ("epic_id", "blocker_id")
);
