import { db } from '../src/config/database.js';
import { sql } from 'drizzle-orm';

try {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "epic_contributors" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "epic_id" uuid NOT NULL,
      "user_id" uuid NOT NULL,
      "role" text DEFAULT 'OTHER' NOT NULL,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "epic_contributors_epic_id_user_id_unique" UNIQUE("epic_id","user_id")
    )
  `);
  await db.execute(sql`
    ALTER TABLE "epic_contributors"
      ADD CONSTRAINT IF NOT EXISTS "epic_contributors_epic_id_epics_id_fk"
      FOREIGN KEY ("epic_id") REFERENCES "epics"("id") ON DELETE cascade
  `);
  await db.execute(sql`
    ALTER TABLE "epic_contributors"
      ADD CONSTRAINT IF NOT EXISTS "epic_contributors_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
  `);
  await db.execute(sql`
    ALTER TABLE "tenants"
      ADD COLUMN IF NOT EXISTS "epic_auto_close" boolean DEFAULT true NOT NULL
  `);
  console.log('✅ Migration applied successfully');
  process.exit(0);
} catch (e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
}
