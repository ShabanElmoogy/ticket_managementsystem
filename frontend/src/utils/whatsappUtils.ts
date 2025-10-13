/**
 * WhatsApp integration utilities for ticket management system
 */

export interface WhatsAppMessage {
  to: string; // Phone number with country code
  message: string;
  ticketId?: string;
  type?: 'notification' | 'update' | 'reminder';
}

export interface WhatsAppContact {
  name: string;
  phone: string;
  countryCode: string;
}

/**
 * Format phone number for WhatsApp (remove special characters, add country code)
 */
export const formatWhatsAppNumber = (phone: string, countryCode: string = '1'): string => {
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (!cleanPhone.startsWith(countryCode)) {
    return `${countryCode}${cleanPhone}`;
  }
  
  return cleanPhone;
};

/**
 * Generate WhatsApp click-to-chat URL
 */
export const generateWhatsAppURL = (phone: string, message?: string): string => {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  return `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ''}`;
};

/**
 * Open WhatsApp chat in new window/tab
 */
export const openWhatsAppChat = (phone: string, message?: string): void => {
  const url = generateWhatsAppURL(phone, message);
  window.open(url, '_blank');
};

/**
 * Generate ticket notification message templates
 */
export const generateTicketMessage = (
  type: 'created' | 'updated' | 'assigned' | 'resolved' | 'closed',
  ticketData: {
    id: string;
    title: string;
    priority?: string;
    assignee?: string;
    customer?: string;
    dueDate?: string;
  }
): string => {
  const { id, title, priority, assignee, customer, dueDate } = ticketData;
  
  switch (type) {
    case 'created':
      return `🎫 *New Ticket Created*\n\n` +
             `*ID:* ${id}\n` +
             `*Title:* ${title}\n` +
             `*Priority:* ${priority || 'Normal'}\n` +
             `*Customer:* ${customer || 'N/A'}\n` +
             `${dueDate ? `*Due Date:* ${dueDate}\n` : ''}` +
             `\nPlease check the ticket management system for more details.`;

    case 'updated':
      return `📝 *Ticket Updated*\n\n` +
             `*ID:* ${id}\n` +
             `*Title:* ${title}\n` +
             `*Priority:* ${priority || 'Normal'}\n` +
             `\nThe ticket has been updated. Please check for latest changes.`;

    case 'assigned':
      return `👤 *Ticket Assigned*\n\n` +
             `*ID:* ${id}\n` +
             `*Title:* ${title}\n` +
             `*Assigned to:* ${assignee}\n` +
             `*Priority:* ${priority || 'Normal'}\n` +
             `${dueDate ? `*Due Date:* ${dueDate}\n` : ''}` +
             `\nPlease review and start working on this ticket.`;

    case 'resolved':
      return `✅ *Ticket Resolved*\n\n` +
             `*ID:* ${id}\n` +
             `*Title:* ${title}\n` +
             `*Resolved by:* ${assignee}\n` +
             `\nThe ticket has been marked as resolved. Please review if needed.`;

    case 'closed':
      return `🔒 *Ticket Closed*\n\n` +
             `*ID:* ${id}\n` +
             `*Title:* ${title}\n` +
             `\nThis ticket has been closed and completed.`;

    default:
      return `📋 *Ticket Notification*\n\n` +
             `*ID:* ${id}\n` +
             `*Title:* ${title}\n` +
             `\nPlease check the ticket management system.`;
  }
};

/**
 * Validate phone number format
 */
export const isValidWhatsAppNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

/**
 * Extract country code from phone number
 */
export const extractCountryCode = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Common country codes
  const countryCodes = ['1', '44', '91', '86', '81', '49', '33', '39', '34', '7'];
  
  for (const code of countryCodes) {
    if (cleanPhone.startsWith(code)) {
      return code;
    }
  }
  
  return '1'; // Default to US/Canada
};

/**
 * WhatsApp Business API message templates (for official API)
 */
export const whatsappTemplates = {
  ticketCreated: {
    name: 'ticket_created',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{ticket_id}}' },
          { type: 'text', text: '{{ticket_title}}' },
          { type: 'text', text: '{{priority}}' }
        ]
      }
    ]
  },
  
  ticketAssigned: {
    name: 'ticket_assigned',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{ticket_id}}' },
          { type: 'text', text: '{{assignee_name}}' },
          { type: 'text', text: '{{due_date}}' }
        ]
      }
    ]
  },
  
  ticketReminder: {
    name: 'ticket_reminder',
    language: { code: 'en' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{ticket_id}}' },
          { type: 'text', text: '{{days_overdue}}' }
        ]
      }
    ]
  }
};

/**
 * Common WhatsApp message shortcuts
 */
export const quickMessages = {
  greeting: "Hello! 👋 How can I help you today?",
  ticketReceived: "Thank you for submitting your ticket. We'll get back to you soon! 🎫",
  workingOnIt: "We're currently working on your request. Will update you shortly! ⚡",
  needMoreInfo: "Could you please provide more details about the issue? 🤔",
  resolved: "Your issue has been resolved! Please let us know if you need anything else. ✅",
  followUp: "Hi! Just following up on your recent ticket. Is everything working well now? 📋"
};

/**
 * Format message with ticket URL (if you have a web interface)
 */
export const addTicketLink = (message: string, ticketId: string, baseUrl: string = window.location.origin): string => {
  const ticketUrl = `${baseUrl}/tickets/${ticketId}`;
  return `${message}\n\n🔗 *View Ticket:* ${ticketUrl}`;
};