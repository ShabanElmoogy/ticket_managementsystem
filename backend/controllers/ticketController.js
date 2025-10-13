import { prisma } from '../config/database.js';
import { logActivity } from '../utils/activityUtils.js';
import { createNotification } from '../utils/notificationUtils.js';
import whatsappNotificationService from '../services/whatsappNotificationService.js';

// Get all tickets with filtering
export const getAllTickets = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedToId = assignedTo;
    if (priority) where.priority = priority;

    // If user is not admin, only show tickets assigned to them or unassigned
    if (req.user.role !== 'ADMIN') {
      where.OR = [
        { assignedToId: req.user.userId },
        { assignedToId: null }
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        application: {
          select: {
            id: true,
            name: true,
            version: true
          }
        },
        labels: {
          include: { label: true }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        application: {
          select: {
            id: true,
            name: true,
            version: true
          }
        },
        labels: {
          include: { label: true }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user has access to this ticket
    if (req.user.role !== 'ADMIN' && 
        ticket.assignedToId !== req.user.userId && 
        ticket.createdById !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
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

    const ticket = await prisma.ticket.create({
      data: {
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
        labels: {
          create: labels.map(labelId => ({ labelId }))
        }
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        application: {
          select: {
            id: true,
            name: true,
            version: true
          }
        },
        labels: {
          include: { label: true }
        }
      }
    });

    // Log activity
    await logActivity({
      ticketId: ticket.id,
      userId: req.user.userId,
      action: 'CREATED',
      description: `Created ticket: ${title}`
    });

    // Create notification for assignee
    if (assignedToId && assignedToId !== req.user.userId) {
      await createNotification({
        userId: assignedToId,
        ticketId: ticket.id,
        type: 'TICKET_ASSIGNED',
        title: 'New Ticket Assigned',
        message: `You have been assigned ticket: ${title}`
      });
    }

    // Emit real-time notification for new ticket
    const targetUsers = assignedToId ? [assignedToId] : null;
    req.emitNotification('TICKET_CREATED', {
      ticket,
      message: `New ticket created: ${title}`,
      createdBy: ticket.createdBy.name
    }, targetUsers);

    // Send WhatsApp notification for new ticket
    try {
      console.log('📱 Sending WhatsApp notification for new ticket:', ticket.id);
      const whatsappResult = await whatsappNotificationService.sendTicketNotification(
        ticket.id, 
        'created'
      );
      
      if (whatsappResult.success) {
        console.log(`✅ WhatsApp notifications sent: ${whatsappResult.message}`);
      } else {
        console.log(`⚠️ WhatsApp notification failed: ${whatsappResult.message}`);
      }
    } catch (whatsappError) {
      // Don't fail ticket creation if WhatsApp fails
      console.error('❌ WhatsApp notification error:', whatsappError.message);
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update ticket
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      assignedToId, 
      priority, 
      title, 
      description, 
      customerId, 
      applicationId,
      dueDate,
      estimatedHours,
      actualHours
    } = req.body;

    // Check if ticket exists and user has access
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      include: { assignedTo: true }
    });

    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions
    if (req.user.role !== 'ADMIN' && 
        existingTicket.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    const changes = [];

    if (status !== undefined && status !== existingTicket.status) {
      updateData.status = status;
      changes.push({ field: 'status', oldValue: existingTicket.status, newValue: status });
    }
    if (priority !== undefined && req.user.role === 'ADMIN' && priority !== existingTicket.priority) {
      updateData.priority = priority;
      changes.push({ field: 'priority', oldValue: existingTicket.priority, newValue: priority });
    }
    if (title !== undefined && req.user.role === 'ADMIN' && title !== existingTicket.title) {
      updateData.title = title;
      changes.push({ field: 'title', oldValue: existingTicket.title, newValue: title });
    }
    if (description !== undefined && req.user.role === 'ADMIN' && description !== existingTicket.description) {
      updateData.description = description;
      changes.push({ field: 'description', oldValue: existingTicket.description, newValue: description });
    }
    if (assignedToId !== undefined && req.user.role === 'ADMIN' && assignedToId !== existingTicket.assignedToId) {
      updateData.assignedToId = assignedToId;
      changes.push({ field: 'assignedTo', oldValue: existingTicket.assignedToId, newValue: assignedToId });
    }
    if (customerId !== undefined && req.user.role === 'ADMIN' && customerId !== existingTicket.customerId) {
      updateData.customerId = customerId;
      changes.push({ field: 'customer', oldValue: existingTicket.customerId, newValue: customerId });
    }
    if (applicationId !== undefined && req.user.role === 'ADMIN' && applicationId !== existingTicket.applicationId) {
      updateData.applicationId = applicationId;
      changes.push({ field: 'application', oldValue: existingTicket.applicationId, newValue: applicationId });
    }
    if (dueDate !== undefined && dueDate !== existingTicket.dueDate?.toISOString()) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
      changes.push({ field: 'dueDate', oldValue: existingTicket.dueDate, newValue: dueDate });
    }
    if (estimatedHours !== undefined && estimatedHours !== existingTicket.estimatedHours) {
      updateData.estimatedHours = estimatedHours;
      changes.push({ field: 'estimatedHours', oldValue: existingTicket.estimatedHours, newValue: estimatedHours });
    }
    if (actualHours !== undefined && actualHours !== existingTicket.actualHours) {
      updateData.actualHours = actualHours;
      changes.push({ field: 'actualHours', oldValue: existingTicket.actualHours, newValue: actualHours });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        application: {
          select: {
            id: true,
            name: true,
            version: true
          }
        },
        labels: {
          include: { label: true }
        }
      }
    });

    // Log activities for each change
    for (const change of changes) {
      await logActivity({
        ticketId: id,
        userId: req.user.userId,
        action: change.field === 'status' ? 'STATUS_CHANGED' : 
                change.field === 'assignedTo' ? 'ASSIGNED' : 'UPDATED',
        description: `Updated ${change.field} from ${change.oldValue || 'none'} to ${change.newValue || 'none'}`,
        oldValue: change.oldValue,
        newValue: change.newValue
      });
    }

    // Create notifications for relevant changes
    if (changes.some(c => c.field === 'assignedTo') && assignedToId && assignedToId !== req.user.userId) {
      await createNotification({
        userId: assignedToId,
        ticketId: id,
        type: 'TICKET_ASSIGNED',
        title: 'Ticket Assigned',
        message: `You have been assigned ticket: ${ticket.title}`
      });

      // Send WhatsApp notification for ticket assignment
      try {
        console.log('📱 Sending WhatsApp notification for ticket assignment:', id);
        const whatsappResult = await whatsappNotificationService.sendTicketNotification(
          id, 
          'assigned'
        );
        
        if (whatsappResult.success) {
          console.log(`✅ WhatsApp assignment notification sent: ${whatsappResult.message}`);
        } else {
          console.log(`⚠️ WhatsApp assignment notification failed: ${whatsappResult.message}`);
        }
      } catch (whatsappError) {
        console.error('❌ WhatsApp assignment notification error:', whatsappError.message);
      }
    }

    if (changes.some(c => c.field === 'status') && ticket.assignedToId && ticket.assignedToId !== req.user.userId) {
      await createNotification({
        userId: ticket.assignedToId,
        ticketId: id,
        type: 'STATUS_CHANGED',
        title: 'Ticket Status Changed',
        message: `Ticket "${ticket.title}" status changed to ${status}`
      });

      // Send WhatsApp notification for status change
      try {
        console.log('📱 Sending WhatsApp notification for status change:', id);
        const whatsappResult = await whatsappNotificationService.sendTicketNotification(
          id, 
          'status_changed'
        );
        
        if (whatsappResult.success) {
          console.log(`✅ WhatsApp status change notification sent: ${whatsappResult.message}`);
        } else {
          console.log(`⚠️ WhatsApp status change notification failed: ${whatsappResult.message}`);
        }
      } catch (whatsappError) {
        console.error('❌ WhatsApp status change notification error:', whatsappError.message);
      }
    }

    // Emit real-time notification for ticket update
    const targetUsers = [];
    if (ticket.assignedToId && ticket.assignedToId !== req.user.userId) {
      targetUsers.push(ticket.assignedToId);
    }
    if (ticket.createdById && ticket.createdById !== req.user.userId) {
      targetUsers.push(ticket.createdById);
    }

    if (targetUsers.length > 0) {
      req.emitNotification('TICKET_UPDATED', {
        ticket,
        message: `Ticket updated: ${ticket.title}`,
        updatedBy: req.user.email,
        changes: changes.map(c => c.field)
      }, targetUsers);
    }

    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete ticket
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ticket.delete({
      where: { id }
    });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Take ticket (assign to current user)
export const takeTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.assignedToId) {
      return res.status(400).json({ error: 'Ticket is already assigned' });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        assignedToId: req.user.userId,
        status: 'IN_PROGRESS'
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity for taking ticket
    await logActivity({
      ticketId: id,
      userId: req.user.userId,
      action: 'ASSIGNED',
      description: `Ticket taken by ${updatedTicket.assignedTo.name}`
    });

    // Emit real-time notification for ticket assignment
    if (updatedTicket.createdById !== req.user.userId) {
      req.emitNotification('TICKET_ASSIGNED', {
        ticket: updatedTicket,
        message: `Ticket taken by ${updatedTicket.assignedTo.name}`,
        assignedTo: updatedTicket.assignedTo.name
      }, [updatedTicket.createdById]);
    }

    // Send WhatsApp notification for ticket being taken
    try {
      console.log('📱 Sending WhatsApp notification for ticket taken:', id);
      const whatsappResult = await whatsappNotificationService.sendTicketNotification(
        id, 
        'assigned'
      );
      
      if (whatsappResult.success) {
        console.log(`✅ WhatsApp ticket taken notification sent: ${whatsappResult.message}`);
      } else {
        console.log(`⚠️ WhatsApp ticket taken notification failed: ${whatsappResult.message}`);
      }
    } catch (whatsappError) {
      console.error('❌ WhatsApp ticket taken notification error:', whatsappError.message);
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Take ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};