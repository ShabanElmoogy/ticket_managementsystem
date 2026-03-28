import { db } from '../../config/database.js';
import { tickets, ticketActivities } from './tickets.schema.js';
import { users } from '../users/users.schema.js';
import { customers } from '../customers/customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { ticketLabels, labels } from '../labels/labels.schema.js';
import { comments } from '../comments/comments.schema.js';
import { eq, and, or, desc, asc, count, inArray, isNull, isNotNull, lt, ilike } from 'drizzle-orm';
import { logActivity } from '../../utils/activityUtils.js';
import { createNotification } from '../../utils/notificationUtils.js';
import { isTenantScopedRole } from '../../middleware/auth.js';
import { notifyWatchers } from './watchers.controller.js';
import { getSlaHours, computeSlaDeadline } from '../../utils/slaUtils.js';

import { getTenantScope, requireTenantScope } from '../../utils/tenantUtils.js';

// Get all tickets with filtering
export const getAllTickets = async (req, res) => {
  try {
    const { status, assignedTo, priority, deleted, search, customerId, applicationId, userId } = req.query;

    const conditions = [];
    if (status) conditions.push(eq(tickets.status, status));
    if (assignedTo === 'none') {
      conditions.push(isNull(tickets.assignedToId));
    } else if (assignedTo) {
      conditions.push(eq(tickets.assignedToId, assignedTo));
    }
    if (priority) conditions.push(eq(tickets.priority, priority));
    if (search) conditions.push(or(ilike(tickets.title, `%${search}%`), ilike(tickets.description, `%${search}%`)));
    if (customerId) conditions.push(eq(tickets.customerId, customerId));
    if (applicationId) conditions.push(eq(tickets.applicationId, applicationId));
    if (userId) conditions.push(or(eq(tickets.createdById, userId), eq(tickets.assignedToId, userId)));
    // deleted filter: 'true' = deleted only, 'false' = active only
    if (deleted === 'true') {
      conditions.push(isNotNull(tickets.deletedAt));
    } else {
      conditions.push(isNull(tickets.deletedAt));
    }

    // Tenant scoping:
    // Tickets table has no tenantId column, so we scope via createdBy user.tenantId.
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    if (isTenantScoped) {
      if (!tenantId) {
        return res.status(403).json({ error: 'Tenant context required' });
      }
      req.tenantId = tenantId;
      conditions.push(eq(users.tenantId, tenantId));
    }

    // Scope non-admin roles to their own tickets
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
      if (req.user.role === 'PROGRAMMER') {
        conditions.push(eq(tickets.programmerId, req.user.userId));
      } else {
        conditions.push(or(eq(tickets.assignedToId, req.user.userId), isNull(tickets.assignedToId)));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const ticketsQuery = db
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        dueDate: tickets.dueDate,
        estimatedHours: tickets.estimatedHours,
        actualHours: tickets.actualHours,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        customerId: tickets.customerId,
        applicationId: tickets.applicationId,
        createdById: tickets.createdById,
        assignedToId: tickets.assignedToId,
        programmerId: tickets.programmerId,
        boardId: tickets.boardId,
        deletedAt: tickets.deletedAt,
        slaDeadline: tickets.slaDeadline,
        emailFrom: tickets.emailFrom,
        emailMessageId: tickets.emailMessageId,
      })
      .from(tickets)
      // join createdBy user so we can tenant-scope
      .innerJoin(users, eq(tickets.createdById, users.id))
      .where(whereClause)
      .orderBy(desc(tickets.createdAt));

    const ticketsDataRaw = await ticketsQuery;
    // Drizzle returns joined rows; normalize to the ticket projection.
    const ticketsData = ticketsDataRaw.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      dueDate: r.dueDate,
      estimatedHours: r.estimatedHours,
      actualHours: r.actualHours,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      customerId: r.customerId,
      applicationId: r.applicationId,
      createdById: r.createdById,
      assignedToId: r.assignedToId,
      programmerId: r.programmerId,
      boardId: r.boardId,
      deletedAt: r.deletedAt,
      slaDeadline: r.slaDeadline,
      emailFrom: r.emailFrom,
      emailMessageId: r.emailMessageId,
    }));

    // Get related data
    const ticketIds = ticketsData.map((t) => t.id);

    let assignedUsers = [],
      createdUsers = [],
      ticketCustomers = [],
      ticketApplications = [],
      labelsData = [],
      commentCounts = [];

    if (ticketIds.length > 0) {
      const assignedUserIds = ticketsData.filter((t) => t.assignedToId).map((t) => t.assignedToId);
      const createdUserIds = ticketsData.map((t) => t.createdById);
      const programmerIds = ticketsData.filter((t) => t.programmerId).map((t) => t.programmerId);
      const customerIds = ticketsData.filter((t) => t.customerId).map((t) => t.customerId);
      const applicationIds = ticketsData.filter((t) => t.applicationId).map((t) => t.applicationId);

      [assignedUsers, createdUsers, ticketCustomers, ticketApplications, labelsData, commentCounts] = await Promise.all([
        assignedUserIds.length > 0
          ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, assignedUserIds))
          : [],
        createdUserIds.length > 0
          ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, createdUserIds))
          : [],
        customerIds.length > 0
          ? db.select({ id: customers.id, name: customers.name, email: customers.email, maintenanceType: customers.maintenanceType, subscriptionStartDate: customers.subscriptionStartDate, subscriptionEndDate: customers.subscriptionEndDate }).from(customers).where(inArray(customers.id, customerIds))
          : [],
        applicationIds.length > 0
          ? db.select({ id: applications.id, name: applications.name, version: applications.version }).from(applications).where(inArray(applications.id, applicationIds))
          : [],
        db
          .select({
            ticketId: ticketLabels.ticketId,
            label: { id: labels.id, name: labels.name, color: labels.color, description: labels.description },
          })
          .from(ticketLabels)
          .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
          .where(inArray(ticketLabels.ticketId, ticketIds)),
        db
          .select({ ticketId: comments.ticketId, count: count() })
          .from(comments)
          .where(inArray(comments.ticketId, ticketIds))
          .groupBy(comments.ticketId),
      ]);

      // Fetch programmer users separately to avoid Promise.all index shift
      const programmerUsers = programmerIds.length > 0
        ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, programmerIds))
        : [];

      // Combine data
      const ticketsWithRelations = ticketsData.map((ticket) => ({
        ...ticket,
        assignedTo: assignedUsers.find((u) => u.id === ticket.assignedToId) || null,
        createdBy: createdUsers.find((u) => u.id === ticket.createdById) || null,
        programmer: programmerUsers.find((u) => u.id === ticket.programmerId) || null,
        customer: ticketCustomers.find((c) => c.id === ticket.customerId) || null,
        application: ticketApplications.find((a) => a.id === ticket.applicationId) || null,
        labels: labelsData.filter((l) => l.ticketId === ticket.id).map((l) => ({ label: l.label })),
        _count: { comments: commentCounts.find((c) => c.ticketId === ticket.id)?.count || 0 },
      }));

      return res.json(ticketsWithRelations);
    }

    res.json([]);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    // Tenant-scoped roles: ensure ticket belongs to their tenant (via createdBy user)
    if (isTenantScoped) {
      if (!tenantId) {
        return res.status(403).json({ error: 'Tenant context required' });
      }
      req.tenantId = tenantId;

      const ticketData = await db
        .select({ ticket: tickets })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(eq(tickets.id, id), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!ticketData.length) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const ticket = ticketData[0].ticket;

      // Get all related data
      const [assignedUser, createdUser, customer, application, labelsData, commentsData, activitiesData] = await Promise.all([
        ticket.assignedToId
          ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, ticket.assignedToId)).limit(1)
          : Promise.resolve([]),
        db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, ticket.createdById)).limit(1),
        ticket.customerId
          ? db.select({ id: customers.id, name: customers.name, email: customers.email, maintenanceType: customers.maintenanceType, subscriptionStartDate: customers.subscriptionStartDate, subscriptionEndDate: customers.subscriptionEndDate }).from(customers).where(eq(customers.id, ticket.customerId)).limit(1)
          : Promise.resolve([]),
        ticket.applicationId
          ? db.select({ id: applications.id, name: applications.name, version: applications.version }).from(applications).where(eq(applications.id, ticket.applicationId)).limit(1)
          : Promise.resolve([]),
        db
          .select({ label: { id: labels.id, name: labels.name, color: labels.color, description: labels.description } })
          .from(ticketLabels)
          .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
          .where(eq(ticketLabels.ticketId, id)),
        db
          .select({
            id: comments.id,
            content: comments.content,
            createdAt: comments.createdAt,
            userId: comments.userId,
            ticketId: comments.ticketId,
            user: { id: users.id, name: users.name, email: users.email },
          })
          .from(comments)
          .innerJoin(users, eq(comments.userId, users.id))
          .where(eq(comments.ticketId, id))
          .orderBy(asc(comments.createdAt)),
        db
          .select({
            id: ticketActivities.id,
            action: ticketActivities.action,
            description: ticketActivities.description,
            oldValue: ticketActivities.oldValue,
            newValue: ticketActivities.newValue,
            createdAt: ticketActivities.createdAt,
            userId: ticketActivities.userId,
            ticketId: ticketActivities.ticketId,
            user: { id: users.id, name: users.name, email: users.email },
          })
          .from(ticketActivities)
          .innerJoin(users, eq(ticketActivities.userId, users.id))
          .where(eq(ticketActivities.ticketId, id))
          .orderBy(desc(ticketActivities.createdAt))
          .limit(20),
      ]);

      const fullTicket = {
        ...ticket,
        assignedTo: assignedUser[0] || null,
        createdBy: createdUser[0] || null,
        customer: customer[0] || null,
        application: application[0] || null,
        labels: labelsData,
        comments: commentsData,
        activities: activitiesData,
      };

      // EMPLOYEE/PROGRAMMER access check
      if ((req.user.role === 'EMPLOYEE' || req.user.role === 'PROGRAMMER') &&
          fullTicket.assignedToId !== req.user.userId &&
          fullTicket.programmerId !== req.user.userId &&
          fullTicket.createdById !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(fullTicket);
    }

    // SUPER_ADMIN (or other non-tenant-scoped roles)
    const ticketData = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);

    if (!ticketData.length) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketData[0];

    // Get all related data
    const [assignedUser, createdUser, customer, application, labelsData, commentsData, activitiesData] = await Promise.all([
      ticket.assignedToId
        ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, ticket.assignedToId)).limit(1)
        : Promise.resolve([]),
      db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, ticket.createdById)).limit(1),
      ticket.customerId
        ? db.select({ id: customers.id, name: customers.name, email: customers.email, maintenanceType: customers.maintenanceType, subscriptionStartDate: customers.subscriptionStartDate, subscriptionEndDate: customers.subscriptionEndDate }).from(customers).where(eq(customers.id, ticket.customerId)).limit(1)
        : Promise.resolve([]),
      ticket.applicationId
        ? db.select({ id: applications.id, name: applications.name, version: applications.version }).from(applications).where(eq(applications.id, ticket.applicationId)).limit(1)
        : Promise.resolve([]),
      db
        .select({ label: { id: labels.id, name: labels.name, color: labels.color, description: labels.description } })
        .from(ticketLabels)
        .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
        .where(eq(ticketLabels.ticketId, id)),
      db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          userId: comments.userId,
          ticketId: comments.ticketId,
          user: { id: users.id, name: users.name, email: users.email },
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.ticketId, id))
        .orderBy(asc(comments.createdAt)),
      db
        .select({
          id: ticketActivities.id,
          action: ticketActivities.action,
          description: ticketActivities.description,
          oldValue: ticketActivities.oldValue,
          newValue: ticketActivities.newValue,
          createdAt: ticketActivities.createdAt,
          userId: ticketActivities.userId,
          ticketId: ticketActivities.ticketId,
          user: { id: users.id, name: users.name, email: users.email },
        })
        .from(ticketActivities)
        .innerJoin(users, eq(ticketActivities.userId, users.id))
        .where(eq(ticketActivities.ticketId, id))
        .orderBy(desc(ticketActivities.createdAt))
        .limit(20),
    ]);

    const fullTicket = {
      ...ticket,
      assignedTo: assignedUser[0] || null,
      createdBy: createdUser[0] || null,
      customer: customer[0] || null,
      application: application[0] || null,
      labels: labelsData,
      comments: commentsData,
      activities: activitiesData,
    };

    // Check if user has access to this ticket
    if (
      req.user.role !== 'SUPER_ADMIN' &&
      req.user.role !== 'TENANT_ADMIN' &&
      fullTicket.assignedToId !== req.user.userId &&
      fullTicket.programmerId !== req.user.userId &&
      fullTicket.createdById !== req.user.userId
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(fullTicket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new ticket
export const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'MEDIUM',
      assignedToId,
      customerId,
      applicationId,
      boardId,
      dueDate,
      estimatedHours,
      labels: labelIds = [],
    } = req.body;

    // Require tenant context for all tenant-scoped roles
    if (isTenantScopedRole(req.user?.role)) {
      const tenantId = requireTenantScope(req);
      req.tenantId = tenantId;

      const [creator] = await db
        .select({ id: users.id, tenantId: users.tenantId })
        .from(users)
        .where(and(eq(users.id, req.user.userId), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!creator) {
        return res.status(403).json({ error: 'Invalid tenant context' });
      }
    }

    const creatorTenantId = req.tenantId || null;
    const slaHours = await getSlaHours(creatorTenantId);
    const slaDeadline = computeSlaDeadline(new Date(), priority, slaHours);

    const [ticket] = await db
      .insert(tickets)
      .values({
        title,
        description,
        priority,
        assignedToId,
        customerId,
        applicationId,
        boardId,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours,
        createdById: req.user.userId,
        slaDeadline,
      })
      .returning();

    // Insert labels if provided
    if (labelIds.length > 0) {
      await db.insert(ticketLabels).values(labelIds.map((labelId) => ({ ticketId: ticket.id, labelId })));
    }

    // Get full ticket data with relations
    const [assignedUser, createdUser, customer, application, labelsData] = await Promise.all([
      assignedToId
        ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, assignedToId)).limit(1)
        : Promise.resolve([]),
      db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, req.user.userId)).limit(1),
      customerId
        ? db.select({ id: customers.id, name: customers.name, email: customers.email, maintenanceType: customers.maintenanceType, subscriptionStartDate: customers.subscriptionStartDate, subscriptionEndDate: customers.subscriptionEndDate }).from(customers).where(eq(customers.id, customerId)).limit(1)
        : Promise.resolve([]),
      applicationId
        ? db.select({ id: applications.id, name: applications.name, version: applications.version }).from(applications).where(eq(applications.id, applicationId)).limit(1)
        : Promise.resolve([]),
      labelIds.length > 0
        ? db
            .select({ label: { id: labels.id, name: labels.name, color: labels.color, description: labels.description } })
            .from(ticketLabels)
            .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
            .where(eq(ticketLabels.ticketId, ticket.id))
        : Promise.resolve([]),
    ]);

    const fullTicket = {
      ...ticket,
      assignedTo: assignedUser[0] || null,
      createdBy: createdUser[0] || null,
      customer: customer[0] || null,
      application: application[0] || null,
      labels: labelsData,
    };

    // Log activity
    await logActivity({
      ticketId: fullTicket.id,
      userId: req.user.userId,
      action: 'CREATED',
      description: `Created ticket: ${title}`,
    });

    // Emit notification only to users of the same tenant (or all if SUPER_ADMIN/no tenant)
    const notificationType = assignedToId ? 'TICKET_ASSIGNED' : 'TICKET_CREATED';
    const notificationPayload = {
      type: notificationType,
      data: {
        ticket: { id: fullTicket.id, title: fullTicket.title, priority: fullTicket.priority, status: fullTicket.status },
        createdBy: createdUser[0]?.name,
        assignedTo: assignedUser[0]?.name || null,
      },
    };

    if (creatorTenantId) {
      // Emit only to users belonging to the same tenant
      const tenantUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.tenantId, creatorTenantId));
      tenantUsers.forEach(({ id }) => req.emitNotification(id, notificationPayload));
    } else {
      req.emitNotification('broadcast', notificationPayload);
    }

    console.log('Ticket created:', assignedToId ? 'assigned' : 'unassigned');
    res.status(201).json(fullTicket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update ticket
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedToId, title, description, dueDate, estimatedHours, actualHours } = req.body;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    if (isTenantScoped) {
      if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

      const [row] = await db
        .select({ id: tickets.id, assignedToId: tickets.assignedToId, status: tickets.status })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(eq(tickets.id, id), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!row) return res.status(404).json({ error: 'Ticket not found' });

      // EMPLOYEE can only update tickets assigned to them; cannot touch programming-phase tickets
      if (req.user.role === 'EMPLOYEE') {
        if (row.assignedToId !== req.user.userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
        const programmingStatuses = ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING'];
        if (programmingStatuses.includes(row.status) && status) {
          return res.status(403).json({ error: 'Ticket is currently handled by a programmer' });
        }
      }
      if (req.user.role === 'PROGRAMMER') {
        const [progRow] = await db.select({ programmerId: tickets.programmerId }).from(tickets).where(eq(tickets.id, id)).limit(1);
        if (progRow?.programmerId !== req.user.userId) return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updateData = {};
    const oldTicket = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    if (!oldTicket.length) return res.status(404).json({ error: 'Ticket not found' });

    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (status === 'RESOLVED' && oldTicket[0].status !== 'RESOLVED') updateData.resolvedAt = new Date();
    else if (status && status !== 'RESOLVED' && oldTicket[0].status === 'RESOLVED') updateData.resolvedAt = null;
    if (priority && priority !== oldTicket[0].priority) {
      const slaHours = await getSlaHours(tenantId);
      updateData.slaDeadline = computeSlaDeadline(oldTicket[0].createdAt, priority, slaHours);
    }
    updateData.updatedAt = new Date();

    const [updated] = await db.update(tickets).set(updateData).where(eq(tickets.id, id)).returning();

    // Log activity
    if (status && status !== oldTicket[0].status) {
      await logActivity({
        ticketId: id,
        userId: req.user.userId,
        action: 'STATUS_CHANGED',
        description: `Status changed to ${status}`,
        oldValue: oldTicket[0].status,
        newValue: status,
      });
    } else if (priority && priority !== oldTicket[0].priority) {
      await logActivity({
        ticketId: id,
        userId: req.user.userId,
        action: 'PRIORITY_CHANGED',
        description: `Priority changed to ${priority}`,
        oldValue: oldTicket[0].priority,
        newValue: priority,
      });
    } else if (dueDate !== undefined) {
      const oldDate = oldTicket[0].dueDate ? new Date(oldTicket[0].dueDate).toLocaleDateString('en-GB') : 'none';
      const newDate = dueDate ? new Date(dueDate).toLocaleDateString('en-GB') : 'none';
      await logActivity({
        ticketId: id,
        userId: req.user.userId,
        action: 'UPDATED',
        description: `Due date changed from ${oldDate} to ${newDate}`,
        oldValue: oldTicket[0].dueDate ? oldTicket[0].dueDate.toISOString() : null,
        newValue: dueDate || null,
      });
    } else {
      await logActivity({
        ticketId: id,
        userId: req.user.userId,
        action: 'UPDATED',
        description: `Ticket updated`,
      });
    }

    // Emit notification so activity feed refreshes
    const [updaterUser] = await db.select({ name: users.name, tenantId: users.tenantId }).from(users).where(eq(users.id, req.user.userId)).limit(1);
    const notificationPayload = {
      type: 'TICKET_UPDATED',
      data: {
        ticket: { id: updated.id, title: updated.title, priority: updated.priority, status: updated.status },
        updatedBy: updaterUser?.name,
        newStatus: status || undefined,
      },
    };
    if (tenantId) {
      const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenantId));
      tenantUsers.forEach(({ id: uid }) => req.emitNotification(uid, notificationPayload));
    } else {
      req.emitNotification('broadcast', notificationPayload);
    }

    // Notify watchers
    await notifyWatchers(id, req.user.userId, notificationPayload, req.emitNotification);

    res.json(updated);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete ticket (soft delete)
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    if (isTenantScoped) {
      if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

      const [row] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(eq(tickets.id, id), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!row) return res.status(404).json({ error: 'Ticket not found' });
    }

    await db.update(tickets).set({ deletedAt: new Date() }).where(eq(tickets.id, id));

    const [ticket] = await db.select({ title: tickets.title }).from(tickets).where(eq(tickets.id, id)).limit(1);
    const [actor] = await db.select({ name: users.name, tenantId: users.tenantId }).from(users).where(eq(users.id, req.user.userId)).limit(1);

    await logActivity({
      ticketId: id,
      userId: req.user.userId,
      action: 'DELETED',
      description: `Ticket deleted`,
    });

    const notificationPayload = {
      type: 'TICKET_UPDATED',
      data: {
        ticket: { id, title: ticket?.title },
        updatedBy: actor?.name,
        newStatus: 'DELETED',
      },
    };
    const notifyTenantId = tenantId || actor?.tenantId;
    if (notifyTenantId) {
      const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, notifyTenantId));
      tenantUsers.forEach(({ id: uid }) => req.emitNotification(uid, notificationPayload));
    } else {
      req.emitNotification('broadcast', notificationPayload);
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Restore ticket
export const restoreTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    if (isTenantScoped) {
      if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

      const [row] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(eq(tickets.id, id), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!row) return res.status(404).json({ error: 'Ticket not found' });
    }

    await db.update(tickets).set({ deletedAt: null }).where(eq(tickets.id, id));

    const [ticket] = await db.select({ title: tickets.title }).from(tickets).where(eq(tickets.id, id)).limit(1);
    const [actor] = await db.select({ name: users.name, tenantId: users.tenantId }).from(users).where(eq(users.id, req.user.userId)).limit(1);

    await logActivity({
      ticketId: id,
      userId: req.user.userId,
      action: 'RESTORED',
      description: `Ticket restored`,
    });

    const notificationPayload = {
      type: 'TICKET_UPDATED',
      data: {
        ticket: { id, title: ticket?.title },
        updatedBy: actor?.name,
        newStatus: 'RESTORED',
      },
    };
    const notifyTenantId = tenantId || actor?.tenantId;
    if (notifyTenantId) {
      const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, notifyTenantId));
      tenantUsers.forEach(({ id: uid }) => req.emitNotification(uid, notificationPayload));
    } else {
      req.emitNotification('broadcast', notificationPayload);
    }

    res.json({ message: 'Ticket restored successfully' });
  } catch (error) {
    console.error('Restore ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Take ticket
export const takeTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    if (isTenantScoped && !tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    const ticketQuery = db.select({ ticket: tickets }).from(tickets);

    const ticket = isTenantScoped
      ? await ticketQuery
          .innerJoin(users, eq(tickets.createdById, users.id))
          .where(and(eq(tickets.id, id), eq(users.tenantId, tenantId)))
          .limit(1)
      : await ticketQuery.where(eq(tickets.id, id)).limit(1);

    if (!ticket.length) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const t = ticket[0].ticket ?? ticket[0];

    if (t.assignedToId) {
      return res.status(400).json({ error: 'Ticket is already assigned' });
    }

    const [updatedTicket] = await db
      .update(tickets)
      .set({ assignedToId: req.user.userId, status: 'IN_PROGRESS' })
      .where(eq(tickets.id, id))
      .returning();

    await logActivity({
      ticketId: id,
      userId: req.user.userId,
      action: 'ASSIGNED',
      description: `Ticket taken and assigned to self`,
      newValue: req.user.userId,
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Take ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk update ticket status
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ error: 'ids and status are required' });
    }

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    if (isTenantScoped && !tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    await db.update(tickets)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : { resolvedAt: null }),
      })
      .where(inArray(tickets.id, ids));

    await Promise.all(ids.map((id) =>
      logActivity({
        ticketId: id,
        userId: req.user.userId,
        action: 'STATUS_CHANGED',
        description: `Status changed to ${status}`,
        newValue: status,
      })
    ));

    const [actor] = await db.select({ name: users.name, tenantId: users.tenantId }).from(users).where(eq(users.id, req.user.userId)).limit(1);
    const notificationPayload = {
      type: 'TICKET_UPDATED',
      data: { updatedBy: actor?.name, newStatus: status },
    };
    const notifyTenantId = tenantId || actor?.tenantId;
    if (notifyTenantId) {
      const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, notifyTenantId));
      tenantUsers.forEach(({ id: uid }) => req.emitNotification(uid, notificationPayload));
    } else {
      req.emitNotification('broadcast', notificationPayload);
    }

    res.json({ updated: ids.length });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reassign ticket (admin only)
export const reassignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    if (!assignedToId) return res.status(400).json({ error: 'assignedToId is required' });

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    let oldTicket;
    if (isTenantScoped) {
      if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });
      const [row] = await db
        .select({ id: tickets.id, assignedToId: tickets.assignedToId, title: tickets.title })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(and(eq(tickets.id, id), eq(users.tenantId, tenantId)))
        .limit(1);
      if (!row) return res.status(404).json({ error: 'Ticket not found' });
      oldTicket = row;
    } else {
      const [row] = await db.select({ id: tickets.id, assignedToId: tickets.assignedToId, title: tickets.title }).from(tickets).where(eq(tickets.id, id)).limit(1);
      if (!row) return res.status(404).json({ error: 'Ticket not found' });
      oldTicket = row;
    }

    const [updated] = await db
      .update(tickets)
      .set({ assignedToId, status: 'IN_PROGRESS', updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();

    const [oldAssignee, newAssignee] = await Promise.all([
      oldTicket.assignedToId
        ? db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, oldTicket.assignedToId)).limit(1)
        : Promise.resolve([]),
      db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, assignedToId)).limit(1),
    ]);

    await logActivity({
      ticketId: id,
      userId: req.user.userId,
      action: 'REASSIGNED',
      description: `Reassigned from ${oldAssignee[0]?.name ?? 'unassigned'} to ${newAssignee[0]?.name}`,
      oldValue: oldTicket.assignedToId ?? null,
      newValue: assignedToId,
    });

    const notificationPayload = {
      type: 'TICKET_ASSIGNED',
      data: {
        ticket: { id: updated.id, title: updated.title, priority: updated.priority, status: updated.status },
        assignedTo: newAssignee[0]?.name,
      },
    };
    if (tenantId) {
      const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenantId));
      tenantUsers.forEach(({ id: uid }) => req.emitNotification(uid, notificationPayload));
    } else {
      req.emitNotification(assignedToId, notificationPayload);
    }

    res.json(updated);
  } catch (error) {
    console.error('Reassign ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get delayed tickets for current user
export const getDelayedTickets = async (req, res) => {
  try {
    const now = new Date();

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const isTenantScoped = isTenantScopedRole(req.user?.role);

    if (isTenantScoped && !tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    const delayedTicketsQuery = db
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        dueDate: tickets.dueDate,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        assignedToId: tickets.assignedToId,
        customerId: tickets.customerId,
        applicationId: tickets.applicationId,
      })
      .from(tickets)
      .where(
        and(
          eq(tickets.assignedToId, req.user.userId),
          or(and(isNull(tickets.dueDate), eq(tickets.status, 'OPEN')), lt(tickets.dueDate, now)),
          or(eq(tickets.status, 'OPEN'), eq(tickets.status, 'IN_PROGRESS'))
        )
      )
      .orderBy(asc(tickets.dueDate));

    const delayedTickets = isTenantScoped
      ? await delayedTicketsQuery
          .innerJoin(users, eq(tickets.createdById, users.id))
          .where(
            and(
              eq(tickets.assignedToId, req.user.userId),
              or(and(isNull(tickets.dueDate), eq(tickets.status, 'OPEN')), lt(tickets.dueDate, now)),
              or(eq(tickets.status, 'OPEN'), eq(tickets.status, 'IN_PROGRESS')),
              eq(users.tenantId, tenantId)
            )
          )
      : await delayedTicketsQuery;

    const normalized = delayedTickets.map((r) => r.ticket ?? r);

    // Get related data separately to avoid alias conflicts
    const customerIds = normalized.filter((t) => t.customerId).map((t) => t.customerId);
    const applicationIds = normalized.filter((t) => t.applicationId).map((t) => t.applicationId);

    const [customersData, applicationsData] = await Promise.all([
      customerIds.length > 0 ? db.select({ id: customers.id, name: customers.name }).from(customers).where(inArray(customers.id, customerIds)) : [],
      applicationIds.length > 0
        ? db.select({ id: applications.id, name: applications.name }).from(applications).where(inArray(applications.id, applicationIds))
        : [],
    ]);

    // Combine data
    const result = normalized.map((ticket) => ({
      ...ticket,
      customer: customersData.find((c) => c.id === ticket.customerId) || null,
      application: applicationsData.find((a) => a.id === ticket.applicationId) || null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get delayed tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
