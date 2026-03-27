import { db } from '../../config/database.js';
import { ticketWatchers } from './watchers.schema.js';
import { users } from '../users/users.schema.js';
import { tickets } from './tickets.schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantScope } from '../../utils/tenantUtils.js';
import { isTenantScopedRole } from '../../middleware/auth.js';

// GET /tickets/:id/watchers
export const getWatchers = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(ticketWatchers)
      .innerJoin(users, eq(ticketWatchers.userId, users.id))
      .where(eq(ticketWatchers.ticketId, id));
    res.json(rows);
  } catch (e) {
    console.error('Get watchers error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /tickets/:id/watch
export const watchTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify ticket exists (and tenant scope)
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    if (isTenantScoped && tenantId) {
      const [row] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(eq(tickets.id, id), eq(users.tenantId, tenantId)))
        .limit(1);
      if (!row) return res.status(404).json({ error: 'Ticket not found' });
    }

    await db.insert(ticketWatchers).values({ ticketId: id, userId }).onConflictDoNothing();
    res.json({ watching: true });
  } catch (e) {
    console.error('Watch ticket error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /tickets/:id/watch
export const unwatchTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await db.delete(ticketWatchers).where(
      and(eq(ticketWatchers.ticketId, id), eq(ticketWatchers.userId, userId))
    );
    res.json({ watching: false });
  } catch (e) {
    console.error('Unwatch ticket error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper: notify all watchers of a ticket (call from ticket update/comment)
export const notifyWatchers = async (ticketId, excludeUserId, payload, emitFn) => {
  try {
    const watchers = await db
      .select({ userId: ticketWatchers.userId })
      .from(ticketWatchers)
      .where(eq(ticketWatchers.ticketId, ticketId));

    watchers
      .filter((w) => w.userId !== excludeUserId)
      .forEach((w) => emitFn(w.userId, payload));
  } catch (e) {
    console.error('Notify watchers error:', e);
  }
};
