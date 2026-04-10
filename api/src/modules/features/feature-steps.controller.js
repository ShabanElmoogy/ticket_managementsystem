import { db } from '../../config/database.js';
import { featureSteps, featureRequests } from './features.schema.js';
import { epics } from '../epics/epics/epics.schema.js';
import { users } from '../users/users.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { eq, asc, inArray } from 'drizzle-orm';
import { createNotification } from '../../utils/notificationUtils.js';

export const listSteps = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select()
      .from(featureSteps)
      .where(eq(featureSteps.featureRequestId, id))
      .orderBy(asc(featureSteps.order));

    const userIds = [...new Set(rows.flatMap((r) => [r.assignedToId, r.assignedProgrammerId]).filter(Boolean))];
    const ticketIds = [...new Set(rows.map((r) => r.linkedTicketId).filter(Boolean))];

    const [enrichedUsers, enrichedTickets] = await Promise.all([
      userIds.length ? db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(inArray(users.id, userIds)) : [],
      ticketIds.length ? db.select({ id: tickets.id, title: tickets.title }).from(tickets).where(inArray(tickets.id, ticketIds)) : [],
    ]);

    const userMap = Object.fromEntries(enrichedUsers.map((u) => [u.id, u]));
    const ticketMap = Object.fromEntries(enrichedTickets.map((t) => [t.id, t]));

    res.json(rows.map((r) => ({
      ...r,
      assignedTo:         r.assignedToId ? (userMap[r.assignedToId] ?? null) : null,
      assignedProgrammer: r.assignedProgrammerId ? (userMap[r.assignedProgrammerId] ?? null) : null,
      linkedTicket:       r.linkedTicketId ? (ticketMap[r.linkedTicketId] ?? null) : null,
    })));
  } catch (err) {
    console.error('listSteps error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedToId, assignedProgrammerId, linkedTicketId } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });

    const existing = await db
      .select({ order: featureSteps.order })
      .from(featureSteps)
      .where(eq(featureSteps.featureRequestId, id))
      .orderBy(asc(featureSteps.order));

    const nextOrder = existing.length ? existing[existing.length - 1].order + 1 : 0;

    const [row] = await db
      .insert(featureSteps)
      .values({
        featureRequestId: id,
        title: title.trim(),
        description: description?.trim() || null,
        order: nextOrder,
        assignedToId: assignedToId || null,
        assignedProgrammerId: assignedProgrammerId || null,
        linkedTicketId: linkedTicketId || null,
      })
      .returning();

    res.status(201).json({ ...row, assignedTo: null, assignedProgrammer: null, linkedTicket: null });
  } catch (err) {
    console.error('createStep error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateStep = async (req, res) => {
  try {
    const { id: featureRequestId, stepId } = req.params;
    const { title, description, status, order, assignedToId, assignedProgrammerId, linkedTicketId } = req.body;

    const patch = { updatedAt: new Date() };
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description || null;
    if (status !== undefined) patch.status = status;
    if (order !== undefined) patch.order = order;
    if (assignedToId !== undefined) patch.assignedToId = assignedToId || null;
    if (assignedProgrammerId !== undefined) patch.assignedProgrammerId = assignedProgrammerId || null;
    if (linkedTicketId !== undefined) patch.linkedTicketId = linkedTicketId || null;

    const [updated] = await db
      .update(featureSteps)
      .set(patch)
      .where(eq(featureSteps.id, stepId))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Step not found' });

    // Fix #2: auto-promote feature to SHIPPED when all steps are DONE
    if (status === 'DONE') {
      const allSteps = await db
        .select({ status: featureSteps.status })
        .from(featureSteps)
        .where(eq(featureSteps.featureRequestId, featureRequestId));

      if (allSteps.length > 0 && allSteps.every((s) => s.status === 'DONE')) {
        const [feat] = await db
          .update(featureRequests)
          .set({ status: 'SHIPPED', updatedAt: new Date() })
          .where(eq(featureRequests.id, featureRequestId))
          .returning({ id: featureRequests.id, title: featureRequests.title, epicId: featureRequests.epicId });

        // Fix #3: auto-complete epic when all its features are SHIPPED
        if (feat?.epicId) {
          const epicFeatures = await db
            .select({ status: featureRequests.status })
            .from(featureRequests)
            .where(eq(featureRequests.epicId, feat.epicId));

          if (epicFeatures.length > 0 && epicFeatures.every((f) => f.status === 'SHIPPED')) {
            await db
              .update(epics)
              .set({ status: 'COMPLETED', updatedAt: new Date() })
              .where(eq(epics.id, feat.epicId));
          }

          // Notify epic owner of auto-promotion to SHIPPED
          const [epic] = await db
            .select({ ownerId: epics.ownerId, title: epics.title })
            .from(epics)
            .where(eq(epics.id, feat.epicId))
            .limit(1);
          if (epic) {
            const actorId = req.user?.userId ?? req.user?.id;
            const notifyIds = [...new Set([epic.ownerId, actorId].filter(Boolean))];
            for (const userId of notifyIds) {
              await createNotification({
                userId,
                ticketId: null,
                type: 'EPIC_FEATURE_STATUS_CHANGED',
                title: 'Feature status updated',
                message: `Feature "${feat.title}" changed to SHIPPED in epic "${epic.title}"`,
              }, req);
            }
          }
        }
      }
    }

    res.json(updated);
  } catch (err) {
    console.error('updateStep error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteStep = async (req, res) => {
  try {
    const { stepId } = req.params;
    await db.delete(featureSteps).where(eq(featureSteps.id, stepId));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteStep error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
