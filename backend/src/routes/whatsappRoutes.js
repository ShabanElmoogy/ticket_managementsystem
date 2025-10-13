const express = require('express');
const router = express.Router();
const WhatsAppService = require('../services/whatsappService');

// Initialize WhatsApp service (singleton)
let whatsappService = null;

const getWhatsAppService = () => {
  if (!whatsappService) {
    whatsappService = new WhatsAppService();
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

// Send ticket notification
router.post('/send-ticket-notification', async (req, res) => {
  try {
    const { ticketData, recipients, notificationType = 'created' } = req.body;
    
    if (!ticketData || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        message: 'Ticket data and recipients array are required'
      });
    }

    const service = getWhatsAppService();
    const results = await service.sendTicketNotification(ticketData, recipients, notificationType);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    res.json({
      success: true,
      message: `Notifications sent: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send ticket notifications',
      error: error.message
    });
  }
});

// Send bulk messages
router.post('/send-bulk', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    const service = getWhatsAppService();
    const results = await service.sendBulkMessages(messages);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    res.json({
      success: true,
      message: `Bulk messages sent: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk messages',
      error: error.message
    });
  }
});

// Send media message
router.post('/send-media', async (req, res) => {
  try {
    const { to, mediaPath, caption = '' } = req.body;
    
    if (!to || !mediaPath) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and media path are required'
      });
    }

    const service = getWhatsAppService();
    const result = await service.sendMediaMessage(to, mediaPath, caption);
    
    res.json({
      success: true,
      message: 'Media message sent successfully',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send media message',
      error: error.message
    });
  }
});

// Get chats
router.get('/chats', async (req, res) => {
  try {
    const service = getWhatsAppService();
    const chats = await service.getChats();
    
    res.json({
      success: true,
      chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get chats',
      error: error.message
    });
  }
});

// Get contact info
router.get('/contact/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const service = getWhatsAppService();
    const contact = await service.getContactInfo(phone);
    
    if (contact) {
      res.json({
        success: true,
        contact
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get contact info',
      error: error.message
    });
  }
});

// Logout WhatsApp
router.post('/logout', async (req, res) => {
  try {
    const service = getWhatsAppService();
    await service.logout();
    
    res.json({
      success: true,
      message: 'WhatsApp client logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: error.message
    });
  }
});

// Destroy WhatsApp client
router.post('/destroy', async (req, res) => {
  try {
    const service = getWhatsAppService();
    await service.destroy();
    whatsappService = null; // Reset singleton
    
    res.json({
      success: true,
      message: 'WhatsApp client destroyed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to destroy client',
      error: error.message
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp API is working',
    timestamp: new Date()
  });
});

module.exports = router;