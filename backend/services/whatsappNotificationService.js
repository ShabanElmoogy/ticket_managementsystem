import BaileysWhatsAppService from './baileysWhatsappService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class WhatsAppNotificationService {
  constructor() {
    this.whatsappService = new BaileysWhatsAppService();
    this.isInitialized = false;
  }

  async initialize() {
    if (!this.isInitialized) {
      await this.whatsappService.initialize();
      this.isInitialized = true;
      console.log('📱 WhatsApp Notification Service initialized');
    }
  }

  async sendTicketNotification(ticketId, notificationType = 'created', additionalRecipients = []) {
    try {
      // Get ticket details with related data
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          assignedTo: true,
          createdBy: true,
          customer: true,
          application: true
        }
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Determine recipients based on notification type
      const recipients = await this.getNotificationRecipients(ticket, notificationType);
      
      // Add any additional recipients
      recipients.push(...additionalRecipients);

      // Filter out recipients without phone numbers or with notifications disabled
      const validRecipients = recipients.filter(recipient => 
        recipient.phone && 
        recipient.whatsappNotifications !== false
      );

      if (validRecipients.length === 0) {
        console.log('📱 No valid WhatsApp recipients found for ticket notification');
        return { success: true, message: 'No valid recipients', results: [] };
      }

      // Ensure WhatsApp service is ready
      if (!this.whatsappService.isReady) {
        console.log('⚠️ WhatsApp service is not ready. Notification will be skipped.');
        return { 
          success: false, 
          message: 'WhatsApp service is not ready. Please scan QR code first.',
          results: [] 
        };
      }

      // Send notifications
      const results = await this.whatsappService.sendTicketNotification(
        {
          id: ticket.id,
          title: ticket.title,
          priority: ticket.priority,
          status: ticket.status,
          assignee: ticket.assignedTo?.name,
          customer: ticket.customer?.name,
          application: ticket.application?.name,
          dueDate: ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : null
        },
        validRecipients.map(r => ({ name: r.name, phone: r.phone })),
        notificationType
      );

      // Log notification activity
      await this.logNotificationActivity(ticket, validRecipients, results, notificationType);

      return {
        success: true,
        message: `WhatsApp notifications sent to ${results.filter(r => r.success).length} recipients`,
        results: results
      };

    } catch (error) {
      console.error('❌ Failed to send WhatsApp notification:', error);
      return {
        success: false,
        message: error.message,
        results: []
      };
    }
  }

  async getNotificationRecipients(ticket, notificationType) {
    const recipients = [];

    switch (notificationType) {
      case 'created':
        // Notify assignee (if assigned) and admins
        if (ticket.assignedTo) {
          recipients.push(ticket.assignedTo);
        }
        // Get all admins
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' }
        });
        recipients.push(...admins);
        break;

      case 'assigned':
        // Notify the assigned user
        if (ticket.assignedTo) {
          recipients.push(ticket.assignedTo);
        }
        break;

      case 'status_changed':
        // Notify assignee and creator
        if (ticket.assignedTo) {
          recipients.push(ticket.assignedTo);
        }
        if (ticket.createdBy && ticket.createdBy.id !== ticket.assignedTo?.id) {
          recipients.push(ticket.createdBy);
        }
        break;

      default:
        // Default: notify assignee
        if (ticket.assignedTo) {
          recipients.push(ticket.assignedTo);
        }
    }

    // Remove duplicates
    const uniqueRecipients = recipients.filter((recipient, index, self) =>
      index === self.findIndex(r => r.id === recipient.id)
    );

    return uniqueRecipients;
  }

  async logNotificationActivity(ticket, recipients, results, notificationType) {
    try {
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      await prisma.ticketActivity.create({
        data: {
          ticketId: ticket.id,
          userId: ticket.createdBy.id,
          action: 'UPDATED',
          description: `WhatsApp notification sent (${notificationType}): ${successCount} successful, ${failureCount} failed`,
          newValue: JSON.stringify({
            type: notificationType,
            recipients: recipients.map(r => ({ name: r.name, phone: r.phone })),
            results: results
          })
        }
      });
    } catch (error) {
      console.error('❌ Failed to log notification activity:', error);
    }
  }

  getWhatsAppService() {
    return this.whatsappService;
  }

  async getStatus() {
    return {
      initialized: this.isInitialized,
      whatsappReady: this.whatsappService.isReady,
      whatsappStatus: this.whatsappService.getStatus()
    };
  }
}

// Create singleton instance
const whatsappNotificationService = new WhatsAppNotificationService();

export default whatsappNotificationService;