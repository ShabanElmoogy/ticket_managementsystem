import { db } from '../src/config/database.js';
try {
  await db.execute(`DO $$ BEGIN
    CREATE TYPE "epic_relation_type" AS ENUM('RELATES_TO', 'DUPLICATES', 'DEPENDS_ON', 'SPLIT_FROM');
  EXCEPTION WHEN duplicate_object THEN null; END $$`);
  console.log('✅ enum created or already exists');
} catch(e) { console.error('enum error:', e.message); }
try {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "epic_relations" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "source_epic_id" uuid NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
      "target_epic_id" uuid NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
      "relation_type" "epic_relation_type" DEFAULT 'RELATES_TO' NOT NULL,
      "created_at" timestamp DEFAULT now()
    )
  `);
  console.log('✅ epic_relations table created (or already exists)');
} catch(e) {
  console.error('❌ Error:', e.message);
}
process.exit(0);
