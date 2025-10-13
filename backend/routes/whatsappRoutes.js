import express from 'express';
import BaileysWhatsAppService from '../services/baileysWhatsappService.js';
import whatsappNotificationService from '../services/whatsappNotificationService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize WhatsApp service (singleton)
let whatsappService = null;

const getWhatsAppService = () => {
  if (!whatsappService) {
    whatsappService = new BaileysWhatsAppService();
  }
  return whatsappService;
};

// Initialize WhatsApp client
router.post('/initialize', async (req, res) => {
  try {
    const service = getWhatsAppService();
    await service.initialize();
    
    res.json({
      success: true,
      message: 'WhatsApp client initialization started',
      status: service.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize WhatsApp client',
      error: error.message
    });
  }
});

// Get WhatsApp client status
router.get('/status', (req, res) => {
  try {
    const service = getWhatsAppService();
    const status = service.getStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get WhatsApp status',
      error: error.message
    });
  }
});

// Get QR code for authentication
router.get('/qr-code', (req, res) => {
  try {
    const service = getWhatsAppService();
    const status = service.getStatus();
    
    if (status.hasQRCode) {
      res.json({
        success: true,
        qrCode: status.qrCode,
        message: 'Scan this QR code with WhatsApp'
      });
    } else if (status.isReady) {
      res.json({
        success: true,
        message: 'WhatsApp is already connected',
        isReady: true
      });
    } else {
      res.json({
        success: false,
        message: 'QR code not available. Initialize client first.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get QR code',
      error: error.message
    });
  }
});

// Send a single message
router.post('/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    const service = getWhatsAppService();
    const result = await service.sendMessage(to, message);
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Send ticket notification using notification service
router.post('/send-ticket-notification', async (req, res) => {
  try {
    const { ticketId, notificationType = 'created', additionalRecipients = [] } = req.body;
    
    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required'
      });
    }

    await whatsappNotificationService.initialize();
    const result = await whatsappNotificationService.sendTicketNotification(
      ticketId, 
      notificationType, 
      additionalRecipients
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send ticket notification',
      error: error.message
    });
  }
});

// Get all users with WhatsApp info
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNotifications: true,
        role: true,
        createdAt: true
      }
    });
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Update user phone number
router.put('/users/:userId/phone', async (req, res) => {
  try {
    const { userId } = req.params;
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNotifications: true
      }
    });
    
    res.json({
      success: true,
      message: 'Phone number updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update phone number',
      error: error.message
    });
  }
});

// Toggle WhatsApp notifications for user
router.put('/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { whatsappNotifications: enabled },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNotifications: true
      }
    });
    
    res.json({
      success: true,
      message: `WhatsApp notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
});

// Test message sending endpoint
router.post('/test-message', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const service = getWhatsAppService();
    const testMessage = message || 'Hello! This is a test message from the Ticket Management System. 👋';
    
    const result = await service.sendMessage(phone, testMessage);
    
    res.json({
      success: true,
      message: 'Test message sent successfully',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test message',
      error: error.message
    });
  }
});

// Check if phone number exists on WhatsApp
router.post('/check-number', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const service = getWhatsAppService();
    const exists = await service.checkNumberExists(phone);
    
    res.json({
      success: true,
      exists,
      phone,
      message: exists ? 'Number exists on WhatsApp' : 'Number does not exist on WhatsApp'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check number',
      error: error.message
    });
  }
});

// Send custom message to users
router.post('/send-custom-message', async (req, res) => {
  try {
    const { userIds, message } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || !message) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array and message are required'
      });
    }

    // Get users with phone numbers
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        phone: { not: null },
        whatsappNotifications: true
      }
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipients found'
      });
    }

    const service = getWhatsAppService();
    const results = [];

    for (const user of users) {
      try {
        const result = await service.sendMessage(user.phone, message);
        results.push({
          ...result,
          recipient: user.name,
          userId: user.id
        });
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          success: false,
          recipient: user.name,
          userId: user.id,
          phone: user.phone,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Messages sent to ${results.filter(r => r.success).length} recipients`,
      results: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send custom message',
      error: error.message
    });
  }
});

// Get notification service status
router.get('/notification-status', async (req, res) => {
  try {
    const status = await whatsappNotificationService.getStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get notification status',
      error: error.message
    });
  }
});

// Clear session and restart
router.post('/clear-session', async (req, res) => {
  try {
    const service = getWhatsAppService();
    await service.clearSession();
    
    res.json({
      success: true,
      message: 'Session cleared and client restarted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear session',
      error: error.message
    });
  }
});

// Force restart client
router.post('/force-restart', async (req, res) => {
  try {
    console.log('🔄 Force restart requested...');
    
    // Destroy current service
    if (whatsappService) {
      await whatsappService.destroy();
    }
    
    // Reset singleton
    whatsappService = null;
    
    // Create new service
    const service = getWhatsAppService();
    
    res.json({
      success: true,
      message: 'WhatsApp client force restarted successfully',
      status: service.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to force restart',
      error: error.message
    });
  }
});

// Switch to Baileys service (compatibility endpoint)
router.post('/use-baileys', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Already using Baileys WhatsApp service (default)',
      service: 'baileys'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to switch to Baileys service',
      error: error.message
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp API is working with Baileys',
    timestamp: new Date()
  });
});

export default router;