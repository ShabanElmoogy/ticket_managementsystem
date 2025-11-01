import { db } from '../../config/database.js';
import { tickets, ticketActivities } from './tickets.schema.js';
import { users } from '../users/users.schema.js';
import { customers } from '../customers/customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { ticketLabels, labels } from '../labels/labels.schema.js';
import { comments } from '../comments/comments.schema.js';
import { eq, and, or, desc, asc, count, inArray, isNull, lt } from 'drizzle-orm';
import { logActivity } from '../../utils/activityUtils.js';
import { createNotification } from '../../utils/notificationUtils.js';

// Get all tickets with filtering
export const getAllTickets = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    
    const conditions = [];
    if (status) conditions.push(eq(tickets.status, status));
    if (assignedTo) conditions.push(eq(tickets.assignedToId, assignedTo));
    if (priority) conditions.push(eq(tickets.priority, priority));

    // If user is not admin, only show tickets assigned to them or unassigned
    if (req.user.role !== 'ADMIN') {
      conditions.push(
        or(
          eq(tickets.assignedToId, req.user.userId),
          isNull(tickets.assignedToId)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const ticketsData = await db
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
        boardId: tickets.boardId
      })
      .from(tickets)
      .where(whereClause)
      .orderBy(desc(tickets.createdAt));

    // Get related data
    const ticketIds = ticketsData.map(t => t.id);
    
    let assignedUsers = [], createdUsers = [], ticketCustomers = [], ticketApplications = [], labelsData = [], commentCounts = [];
    
    if (ticketIds.length > 0) {
      const assignedUserIds = ticketsData.filter(t => t.assignedToId).map(t => t.assignedToId);
      const createdUserIds = ticketsData.map(t => t.createdById);
      const customerIds = ticketsData.filter(t => t.customerId).map(t => t.customerId);
      const applicationIds = ticketsData.filter(t => t.applicationId).map(t => t.applicationId);
      
      [assignedUsers, createdUsers, ticketCustomers, ticketApplications, labelsData, commentCounts] = await Promise.all([
        assignedUserIds.length > 0 ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, assignedUserIds)) : [],
        createdUserIds.length > 0 ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, createdUserIds)) : [],
        customerIds.length > 0 ? db.select({ id: customers.id, name: customers.name, email: customers.email }).from(customers).where(inArray(customers.id, customerIds)) : [],
        applicationIds.length > 0 ? db.select({ id: applications.id, name: applications.name, version: applications.version }).from(applications).where(inArray(applications.id, applicationIds)) : [],
        db.select({ ticketId: ticketLabels.ticketId, label: { id: labels.id, name: labels.name, color: labels.color, description: labels.description } }).from(ticketLabels).innerJoin(labels, eq(ticketLabels.labelId, labels.id)).where(inArray(ticketLabels.ticketId, ticketIds)),
        db.select({ ticketId: comments.ticketId, count: count() }).from(comments).where(inArray(comments.ticketId, ticketIds)).groupBy(comments.ticketId)
      ]);
    }

    // Combine data
    const ticketsWithRelations = ticketsData.map(ticket => ({
      ...ticket,
      assignedTo: assignedUsers.find(u => u.id === ticket.assignedToId) || null,
      createdBy: createdUsers.find(u => u.id === ticket.createdById) || null,
      customer: ticketCustomers.find(c => c.id === ticket.customerId) || null,
      application: ticketApplications.find(a => a.id === ticket.applicationId) || null,
      labels: labelsData.filter(l => l.ticketId === ticket.id).map(l => ({ label: l.label })),
      _count: { comments: commentCounts.find(c => c.ticketId === ticket.id)?.count || 0 }
    }));

    res.json(ticketsWithRelations);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticketData = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);

    if (!ticketData.length) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketData[0];

    // Get all related data
    const [assignedUser, createdUser, customer, application, labelsData, commentsData, activitiesData] = await Promise.all([
      ticket.assignedToId ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, ticket.assignedToId)).limit(1) : Promise.resolve([]),
      db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, ticket.createdById)).limit(1),
      ticket.customerId ? db.select({ id: customers.id, name: customers.name, email: customers.email }).from(customers).where(eq(customers.id, ticket.customerId)).limit(1) : Promise.resolve([]),
      ticket.applicationId ? db.select({ id: applications.id, name: applications.name, version: applications.version }).from(applications).where(eq(applications.id, ticket.applicationId)).limit(1) : Promise.resolve([]),
      db.select({ label: { id: labels.id, name: labels.name, color: labels.color, description: labels.description } }).from(ticketLabels).innerJoin(labels, eq(ticketLabels.labelId, labels.id)).where(eq(ticketLabels.ticketId, id)),
      db.select({ id: comments.id, content: comments.content, createdAt: comments.createdAt, userId: comments.userId, ticketId: comments.ticketId, user: { id: users.id, name: users.name, email: users.email } }).from(comments).innerJoin(users, eq(comments.userId, users.id)).where(eq(comments.ticketId, id)).orderBy(asc(comments.createdAt)),
      db.select({ id: ticketActivities.id, action: ticketActivities.action, description: ticketActivities.description, oldValue: ticketActivities.oldValue, newValue: ticketActivities.newValue, createdAt: ticketActivities.createdAt, userId: ticketActivities.userId, ticketId: ticketActivities.ticketId, user: { id: users.id, name: users.name, email: users.email } }).from(ticketActivities).innerJoin(users, eq(ticketActivities.userId, users.id)).where(eq(ticketActivities.ticketId, id)).orderBy(desc(ticketActivities.createdAt)).limit(20)
    ]);

    const fullTicket = {
      ...ticket,
      assignedTo: assignedUser[0] || null,
      createdBy: createdUser[0] || null,
      customer: customer[0] || null,
      application: application[0] || null,
      labels: labelsData,
      comments: commentsData,
      activities: activitiesData
    };

    // Check if user has access to this ticket
    if (req.user.role !== 'ADMIN' && 
        fullTicket.assignedToId !== req.user.userId && 
        fullTicket.createdById !== req.user.userId) {
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
      labels = []
    } = req.body;

    const [ticket] = await db.insert(tickets).values({
      title, description, priority, assignedToId, customerId, applicationId, boardId,
      dueDate: dueDate ? new Date(dueDate) : null, estimatedHours, createdById: req.user.userId
    }).returning();

    // Insert labels if provided
    if (labels.length > 0) {
      await db.insert(ticketLabels).values(labels.map(labelId => ({ ticketId: ticket.id, labelId })));
    }

    // Get full ticket data with relations
    const [assignedUser, createdUser, customer, application, labelsData] = await Promise.all([
      assignedToId ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, assignedToId)).limit(1) : Promise.resolve([]),
      db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, req.user.userId)).limit(1),
      customerId ? db.select({ id: customers.id, name: customers.name, email: customers.email }).from(customers).where(eq(customers.id, customerId)).limit(1) : Promise.resolve([]),
      applicationId ? db.select({ id: applications.id, name: applications.name, version: applications.version }).from(applications).where(eq(applications.id, applicationId)).limit(1) : Promise.resolve([]),
      labels.length > 0 ? db.select({ label: { id: labels.id, name: labels.name, color: labels.color, description: labels.description } }).from(ticketLabels).innerJoin(labels, eq(ticketLabels.labelId, labels.id)).where(eq(ticketLabels.ticketId, ticket.id)) : Promise.resolve([])
    ]);

    const fullTicket = {
      ...ticket,
      assignedTo: assignedUser[0] || null,
      createdBy: createdUser[0] || null,
      customer: customer[0] || null,
      application: application[0] || null,
      labels: labelsData
    };

    // Log activity
    await logActivity({
      ticketId: fullTicket.id,
      userId: req.user.userId,
      action: 'CREATED',
      description: `Created ticket: ${title}`
    });

    // Create notification for assignee
    if (assignedToId && assignedToId !== req.user.userId) {
      await createNotification({
        userId: assignedToId,
        ticketId: fullTicket.id,
        type: 'TICKET_ASSIGNED',
        title: 'New Ticket Assigned',
        message: `You have been assigned ticket: ${title}`
      });
    }

    res.status(201).json(fullTicket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update ticket
export const updateTicket = async (req, res) => {
  try {
    res.json({ message: 'Update ticket not implemented yet' });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete ticket
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(tickets).where(eq(tickets.id, id));
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Take ticket
export const takeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    
    if (!ticket.length) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    if (ticket[0].assignedToId) {
      return res.status(400).json({ error: 'Ticket is already assigned' });
    }
    
    const [updatedTicket] = await db.update(tickets)
      .set({ assignedToId: req.user.userId, status: 'IN_PROGRESS' })
      .where(eq(tickets.id, id))
      .returning();
    
    res.json(updatedTicket);
  } catch (error) {
    console.error('Take ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get delayed tickets for current user
export const getDelayedTickets = async (req, res) => {
  try {
    const now = new Date();
    
    const delayedTickets = await db
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
        applicationId: tickets.applicationId
      })
      .from(tickets)
      .where(
        and(
          eq(tickets.assignedToId, req.user.userId),
          or(
            and(isNull(tickets.dueDate), eq(tickets.status, 'OPEN')),
            lt(tickets.dueDate, now)
          ),
          or(eq(tickets.status, 'OPEN'), eq(tickets.status, 'IN_PROGRESS'))
        )
      )
      .orderBy(asc(tickets.dueDate));

    // Get related data separately to avoid alias conflicts
    const customerIds = delayedTickets.filter(t => t.customerId).map(t => t.customerId);
    const applicationIds = delayedTickets.filter(t => t.applicationId).map(t => t.applicationId);
    
    const [customersData, applicationsData] = await Promise.all([
      customerIds.length > 0 ? db.select({ id: customers.id, name: customers.name }).from(customers).where(inArray(customers.id, customerIds)) : [],
      applicationIds.length > 0 ? db.select({ id: applications.id, name: applications.name }).from(applications).where(inArray(applications.id, applicationIds)) : []
    ]);

    // Combine data
    const result = delayedTickets.map(ticket => ({
      ...ticket,
      customer: customersData.find(c => c.id === ticket.customerId) || null,
      application: applicationsData.find(a => a.id === ticket.applicationId) || null
    }));

    res.json(result);
  } catch (error) {
    console.error('Get delayed tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};