import { db } from '../../../config/database.js';
import { customerVisits } from './customerVisits.schema.js';
import { users } from '../../users/users.schema.js';
import { eq, desc, and } from 'drizzle-orm';

// ── Column selection — never return password ──────────────────────────────────

const VISIT_COLUMNS = {
  id:         customerVisits.id,
  customerId: customerVisits.customerId,
  userId:     customerVisits.userId,
  status:     customerVisits.status,
  visitedAt:  customerVisits.visitedAt,
  notes:      customerVisits.notes,
  latitude:   customerVisits.latitude,
  longitude:  customerVisits.longitude,
  createdAt:  customerVisits.createdAt,
  updatedAt:  customerVisits.updatedAt,
};

const USER_COLUMNS = {
  id:   users.id,
  name: users.name,
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findVisitsByCustomer(customerId) {
  const rows = await db
    .select({ ...VISIT_COLUMNS, user: USER_COLUMNS })
    .from(customerVisits)
    .leftJoin(users, eq(customerVisits.userId, users.id))
    .where(eq(customerVisits.customerId, customerId))
    .orderBy(desc(customerVisits.visitedAt));
  return rows;
}

export async function findVisitById(id) {
  const rows = await db
    .select({ ...VISIT_COLUMNS, user: USER_COLUMNS })
    .from(customerVisits)
    .leftJoin(users, eq(customerVisits.userId, users.id))
    .where(eq(customerVisits.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function insertVisit(values) {
  const [visit] = await db
    .insert(customerVisits)
    .values(values)
    .returning(VISIT_COLUMNS);
  return visit;
}

export async function updateVisitById(id, data) {
  const [visit] = await db
    .update(customerVisits)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customerVisits.id, id))
    .returning(VISIT_COLUMNS);
  return visit;
}

export async function deleteVisitById(id) {
  const [deleted] = await db
    .delete(customerVisits)
    .where(eq(customerVisits.id, id))
    .returning({ id: customerVisits.id });
  return deleted ?? null;
}

export async function countVisitsByCustomer(customerId) {
  const rows = await db
    .select({ id: customerVisits.id })
    .from(customerVisits)
    .where(eq(customerVisits.customerId, customerId));
  return rows.length;
}
