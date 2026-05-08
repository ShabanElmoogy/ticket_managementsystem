/**
 * Backfill tenant_id on existing notifications that have NULL tenant_id.
 * Run once: node scripts/backfill-notification-tenant.js
 */

import { db } from '../src/config/database.js';
import { notifications } from '../src/modules/notifications/notifications.schema.js';
import { users } from '../src/modules/users/users.schema.js';
import { eq, isNull } from 'drizzle-orm';

async function backfill() {
  console.log('Backfilling tenant_id on notifications...');

  // Find all notifications with NULL tenant_id
  const rows = await db
    .select({ id: notifications.id, userId: notifications.userId })
    .from(notifications)
    .where(isNull(notifications.tenantId));

  console.log(`Found ${rows.length} notifications with NULL tenant_id`);
  if (rows.length === 0) { console.log('Nothing to do.'); process.exit(0); }

  // Batch: get all unique userIds
  const userIds = [...new Set(rows.map((r) => r.userId))];
  const userRows = await db
    .select({ id: users.id, tenantId: users.tenantId })
    .from(users)
    .where(eq(users.id, userIds[0])); // fetch one at a time below

  // Build userId → tenantId map
  const tenantMap = new Map();
  for (const uid of userIds) {
    const [u] = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, uid))
      .limit(1);
    if (u?.tenantId) tenantMap.set(uid, u.tenantId);
  }

  // Update each notification
  let updated = 0;
  for (const row of rows) {
    const tenantId = tenantMap.get(row.userId);
    if (!tenantId) continue;
    await db
      .update(notifications)
      .set({ tenantId })
      .where(eq(notifications.id, row.id));
    updated++;
  }

  console.log(`✅ Updated ${updated} notifications with tenant_id`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
