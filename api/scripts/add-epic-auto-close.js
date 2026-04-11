import { db } from '../src/config/database.js';
import { sql } from 'drizzle-orm';

try {
  await db.execute(sql`
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS epic_auto_close boolean NOT NULL DEFAULT true
  `);
  console.log('✅ epic_auto_close column added');
  process.exit(0);
} catch (e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
}
