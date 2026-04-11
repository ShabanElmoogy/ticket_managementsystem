import { db } from '../src/config/database.js';
try {
  await db.execute(`ALTER TABLE epics ADD COLUMN IF NOT EXISTS parent_epic_id uuid`);
  console.log('✅ parent_epic_id column added (or already exists)');
} catch(e) {
  console.error('❌ Error:', e.message);
}
process.exit(0);
