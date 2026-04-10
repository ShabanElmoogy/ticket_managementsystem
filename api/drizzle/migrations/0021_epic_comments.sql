CREATE TABLE IF NOT EXISTS "epic_comments" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "content"    text NOT NULL,
  "epic_id"    uuid NOT NULL REFERENCES "epics"("id") ON DELETE CASCADE,
  "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
