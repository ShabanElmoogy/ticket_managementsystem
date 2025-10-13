/**
 * WhatsApp integration utilities for ticket management
 */

export interface TicketNotificationData {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignee?: {
    id: string;
    name: string;
    phone?: string;
  };
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
  createdBy?: {
    id: string;
    name: string;
    phone?: string;
  };
  dueDate?: string;
  description?: string;
}

export interface NotificationRecipient {
  name: string;
  phone: string;
  role?: 'assignee' | 'customer' | 'manager' | 'team';
}

/**
 * Send WhatsApp notification when ticket is created
 */
export const sendTicketCreatedNotification = async (
  ticketData: TicketNotificationData,
  recipients: NotificationRecipient[]
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/whatsapp/send-ticket-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketData,
        recipients,
        notificationType: 'created'
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to send ticket created notification:', error);
    throw error;
  }
};

/**
 * Send WhatsApp notification when ticket is assigned
 */
export const sendTicketAssignedNotification = async (
  ticketData: TicketNotificationData,
  assignee: NotificationRecipient
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/whatsapp/send-ticket-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketData,
        recipients: [assignee],
        notificationType: 'assigned'
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to send ticket assigned notification:', error);
    throw error;
  }
};

/**
 * Send WhatsApp notification when ticket status changes
 */
export const sendTicketStatusNotification = async (
  ticketData: TicketNotificationData,
  recipients: NotificationRecipient[],
  oldStatus: string,
  newStatus: string
) => {
  let notificationType = 'updated';
  
  if (newStatus === 'RESOLVED') {
    notificationType = 'resolved';
  } else if (newStatus === 'CLOSED') {
    notificationType = 'closed';
  }

  try {
    const response = await fetch(`${API_BASE_URL}/whatsapp/send-ticket-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketData: {
          ...ticketData,
          previousStatus: oldStatus
        },
        recipients,
        notificationType
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to send ticket status notification:', error);
    throw error;
  }
};

/**
 * Send WhatsApp reminder for overdue tickets
 */
export const sendTicketReminderNotification = async (
  ticketData: TicketNotificationData,
  recipients: NotificationRecipient[]
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/whatsapp/send-ticket-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketData,
        recipients,
        notificationType: 'reminder'
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to send ticket reminder notification:', error);
    throw error;
  }
};

/**
 * Get notification recipients based on ticket data and notification type
 */
export const getNotificationRecipients = (
  ticketData: TicketNotificationData,
  notificationType: string,
  includeCustomer: boolean = true,
  includeAssignee: boolean = true,
  additionalRecipients: NotificationRecipient[] = []
): NotificationRecipient[] => {
  const recipients: NotificationRecipient[] = [];

  // Add assignee
  if (includeAssignee && ticketData.assignee?.phone) {
    recipients.push({
      name: ticketData.assignee.name,
      phone: ticketData.assignee.phone,
      role: 'assignee'
    });
  }

  // Add customer
  if (includeCustomer && ticketData.customer?.phone) {
    recipients.push({
      name: ticketData.customer.name,
      phone: ticketData.customer.phone,
      role: 'customer'
    });
  }

  // Add creator (for updates)
  if (notificationType === 'resolved' || notificationType === 'closed') {
    if (ticketData.createdBy?.phone) {
      recipients.push({
        name: ticketData.createdBy.name,
        phone: ticketData.createdBy.phone,
        role: 'team'
      });
    }
  }

  // Add additional recipients
  recipients.push(...additionalRecipients);

  // Remove duplicates based on phone number
  const uniqueRecipients = recipients.filter((recipient, index, self) =>
    index === self.findIndex(r => r.phone === recipient.phone)
  );

  return uniqueRecipients;
};

/**
 * Format phone number for WhatsApp
 */
export const formatWhatsAppNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present (default to +1)
  if (!cleaned.startsWith('1') && cleaned.length === 10) {
    return `1${cleaned}`;
  }
  
  return cleaned;
};

/**
 * Validate phone number
 */
export const isValidWhatsAppNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Check if WhatsApp is available and ready
 */
export const checkWhatsAppStatus = async (): Promise<{
  isReady: boolean;
  hasQRCode: boolean;
  error?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
    const data = await response.json();
    
    if (data.success) {
      return data.status;
    } else {
      return {
        isReady: false,
        hasQRCode: false,
        error: data.message
      };
    }
  } catch (error) {
    return {
      isReady: false,
      hasQRCode: false,
      error: 'Failed to check WhatsApp status'
    };
  }
};

/**
 * Generate WhatsApp click-to-chat URL (fallback when API is not available)
 */
export const generateWhatsAppURL = (phone: string, message?: string): string => {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  return `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ''}`;
};

/**
 * Open WhatsApp chat in new window (fallback method)
 */
export const openWhatsAppChat = (phone: string, message?: string): void => {
  const url = generateWhatsAppURL(phone, message);
  window.open(url, '_blank');
};