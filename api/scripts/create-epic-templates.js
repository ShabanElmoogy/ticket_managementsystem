import { db } from '../src/config/database.js';
import { sql } from 'drizzle-orm';

try {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "epic_templates" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "description" text,
      "category" text DEFAULT 'General' NOT NULL,
      "features" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "tenant_id" uuid REFERENCES tenants(id) ON DELETE CASCADE,
      "created_by_id" uuid REFERENCES users(id) ON DELETE SET NULL,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `);
  console.log('✅ epic_templates table created');
  process.exit(0);
} catch (e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
}
