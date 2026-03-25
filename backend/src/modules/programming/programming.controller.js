import { db } from '../../config/database.js';
import { programmingDetails } from '../tickets/tickets.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '../../utils/activityUtils.js';
import { getTenantScope } from '../../utils/tenantUtils.js';
import { Role } from '../../constants/roles.js';

function resolveTenantId(req) {
  const scope = getTenantScope(req);
  const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
  if (!tenantId) {
    const err = new Error('Tenant context required');
    err.status = 403;
    throw err;
  }
  return tenantId;
}

// GET /tickets/:id/programming
export const getProgrammingDetails = async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const tenantId = resolveTenantId(req);

    const [detail] = await db
      .select()
      .from(programmingDetails)
      .where(and(eq(programmingDetails.ticketId, ticketId), eq(programmingDetails.tenantId, tenantId)))
      .limit(1);

    if (!detail) return res.json(null);

    // Programmer can only see their own ticket's details
    if (req.user.role === Role.PROGRAMMER && detail.programmerId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(detail);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Get programming details error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /tickets/:id/programming  (upsert)
export const upsertProgrammingDetails = async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const tenantId = resolveTenantId(req);

    // Verify ticket belongs to tenant
    const [ticket] = await db
      .select({ id: tickets.id, programmerId: tickets.programmerId })
      .from(tickets)
      .innerJoin(users, eq(tickets.createdById, users.id))
      .where(and(eq(tickets.id, ticketId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Programmer can only edit their own assigned ticket
    if (req.user.role === Role.PROGRAMMER && ticket.programmerId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payload = { ...req.body, ticketId, tenantId, updatedAt: new Date() };

    const [existing] = await db
      .select({ id: programmingDetails.id })
      .from(programmingDetails)
      .where(eq(programmingDetails.ticketId, ticketId))
      .limit(1);

    const [result] = existing
      ? await db.update(programmingDetails).set(payload).where(eq(programmingDetails.ticketId, ticketId)).returning()
      : await db.insert(programmingDetails).values(payload).returning();

    await logActivity({
      ticketId,
      userId: req.user.userId,
      action: 'PROGRAMMING_UPDATED',
      description: 'Programming details updated',
    });

    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Upsert programming details error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /tickets/:id/assign-programmer
export const assignProgrammer = async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const { programmerId } = req.body;
    const tenantId = resolveTenantId(req);

    // Verify programmer exists, belongs to tenant, has PROGRAMMER role
    const [programmer] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.id, programmerId), eq(users.tenantId, tenantId), eq(users.role, Role.PROGRAMMER)))
      .limit(1);

    if (!programmer) return res.status(404).json({ error: 'Programmer not found in this tenant' });

    const [updated] = await db
      .update(tickets)
      .set({ programmerId, status: 'PROGRAMMING', updatedAt: new Date() })
      .where(eq(tickets.id, ticketId))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Ticket not found' });

    await logActivity({
      ticketId,
      userId: req.user.userId,
      action: 'PROGRAMMER_ASSIGNED',
      description: `Assigned to programmer: ${programmer.name}`,
      newValue: programmerId,
    });

    // Notify all tenant users so activity feed updates for everyone
    const tenantUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    const payload = {
      type: 'TICKET_ASSIGNED',
      data: {
        ticket: { id: updated.id, title: updated.title, status: updated.status },
        assignedTo: programmer.name,
        updatedBy: req.user.name,
      },
    };
    tenantUsers.forEach(({ id }) => req.emitNotification(id, payload));

    res.json(updated);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Assign programmer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
