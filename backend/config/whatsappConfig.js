/**
 * WhatsApp Notification Configuration
 */

export const whatsappConfig = {
  // Enable/disable WhatsApp notifications globally
  enabled: process.env.WHATSAPP_NOTIFICATIONS_ENABLED !== 'false',
  
  // Auto-initialize WhatsApp service on server start
  autoInitialize: process.env.WHATSAPP_AUTO_INITIALIZE === 'true',
  
  // Notification settings for different events
  notifications: {
    ticketCreated: {
      enabled: true,
      notifyAdmins: true,
      notifyAssignee: true,
      notifyCreator: false // Usually the creator knows they created it
    },
    ticketAssigned: {
      enabled: true,
      notifyAssignee: true,
      notifyCreator: true,
      notifyAdmins: false
    },
    ticketStatusChanged: {
      enabled: true,
      notifyAssignee: true,
      notifyCreator: true,
      notifyAdmins: false
    },
    ticketResolved: {
      enabled: true,
      notifyCreator: true,
      notifyAdmins: true,
      notifyAssignee: false
    },
    ticketDueSoon: {
      enabled: true,
      notifyAssignee: true,
      notifyAdmins: true,
      hoursBeforeDue: 24
    },
    ticketOverdue: {
      enabled: true,
      notifyAssignee: true,
      notifyAdmins: true
    }
  },
  
  // Message templates
  templates: {
    ticketCreated: {
      title: '🎫 New Ticket Created',
      format: `🎫 *New Ticket Created*

*ID:* {{id}}
*Title:* {{title}}
*Priority:* {{priority}}
*Customer:* {{customer}}
*Assigned to:* {{assignee}}
*Due Date:* {{dueDate}}

📋 Please check the ticket management system for more details.`
    },
    ticketAssigned: {
      title: '👤 Ticket Assigned',
      format: `👤 *Ticket Assigned to You*

*ID:* {{id}}
*Title:* {{title}}
*Priority:* {{priority}}
*Customer:* {{customer}}
*Due Date:* {{dueDate}}

⚡ Please review and start working on this ticket.`
    },
    ticketStatusChanged: {
      title: '📝 Ticket Status Updated',
      format: `📝 *Ticket Status Updated*

*ID:* {{id}}
*Title:* {{title}}
*New Status:* {{status}}
*Priority:* {{priority}}
*Assigned to:* {{assignee}}

🔄 The ticket status has been changed.`
    },
    ticketResolved: {
      title: '✅ Ticket Resolved',
      format: `✅ *Ticket Resolved*

*ID:* {{id}}
*Title:* {{title}}
*Resolved by:* {{resolvedBy}}

🎉 The ticket has been marked as resolved.`
    },
    ticketDueSoon: {
      title: '⏰ Ticket Due Soon',
      format: `⏰ *Ticket Due Soon*

*ID:* {{id}}
*Title:* {{title}}
*Priority:* {{priority}}
*Due Date:* {{dueDate}}
*Assigned to:* {{assignee}}

⚠️ This ticket is due within 24 hours!`
    },
    ticketOverdue: {
      title: '🚨 Ticket Overdue',
      format: `🚨 *Ticket Overdue*

*ID:* {{id}}
*Title:* {{title}}
*Priority:* {{priority}}
*Due Date:* {{dueDate}}
*Assigned to:* {{assignee}}

❗ This ticket is overdue and needs immediate attention!`
    }
  },
  
  // Rate limiting settings
  rateLimiting: {
    maxMessagesPerMinute: 10,
    delayBetweenMessages: 1000, // 1 second
    maxRetriesOnFailure: 3
  },
  
  // Logging settings
  logging: {
    logSuccessfulNotifications: true,
    logFailedNotifications: true,
    logToDatabase: true,
    logToConsole: true
  }
};

export default whatsappConfig;