const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.sessionPath = path.join(__dirname, '../data/whatsapp-session');
    
    this.initializeClient();
  }

  initializeClient() {
    // Create client with local authentication to save session
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'ticket-management-system',
        dataPath: this.sessionPath
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // QR Code generation
    this.client.on('qr', (qr) => {
      console.log('📱 WhatsApp QR Code generated. Scan with your phone:');
      qrcode.generate(qr, { small: true });
      this.qrCode = qr;
      
      // Save QR code for frontend display
      this.saveQRCode(qr);
    });

    // Client ready
    this.client.on('ready', () => {
      console.log('✅ WhatsApp Client is ready!');
      this.isReady = true;
      this.qrCode = null;
    });

    // Authentication success
    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp Client authenticated successfully');
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication failed:', msg);
      this.isReady = false;
    });

    // Client disconnected
    this.client.on('disconnected', (reason) => {
      console.log('📱 WhatsApp Client disconnected:', reason);
      this.isReady = false;
    });

    // Message received (for auto-replies or logging)
    this.client.on('message', async (message) => {
      console.log('📨 Message received:', message.body);
      
      // Auto-reply for ticket-related keywords
      if (message.body.toLowerCase().includes('ticket') || 
          message.body.toLowerCase().includes('support')) {
        await this.sendAutoReply(message);
      }
    });

    // Error handling
    this.client.on('error', (error) => {
      console.error('❌ WhatsApp Client error:', error);
    });
  }

  async initialize() {
    try {
      console.log('🚀 Initializing WhatsApp Client...');
      await this.client.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp Client:', error);
      throw error;
    }
  }

  async sendMessage(to, message, options = {}) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Please scan QR code first.');
    }

    try {
      // Format phone number (remove special characters, ensure country code)
      const formattedNumber = this.formatPhoneNumber(to);
      const chatId = `${formattedNumber}@c.us`;

      // Send message
      const sentMessage = await this.client.sendMessage(chatId, message);
      
      console.log(`✅ Message sent to ${formattedNumber}: ${message.substring(0, 50)}...`);
      
      return {
        success: true,
        messageId: sentMessage.id._serialized,
        to: formattedNumber,
        message: message,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  async sendTicketNotification(ticketData, recipients, notificationType = 'created') {
    const message = this.generateTicketMessage(notificationType, ticketData);
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendMessage(recipient.phone, message);
        results.push({
          ...result,
          recipient: recipient.name,
          phone: recipient.phone
        });
      } catch (error) {
        results.push({
          success: false,
          recipient: recipient.name,
          phone: recipient.phone,
          error: error.message
        });
      }
    }

    return results;
  }

  async sendBulkMessages(messages) {
    const results = [];
    
    for (const msg of messages) {
      try {
        const result = await this.sendMessage(msg.to, msg.message);
        results.push(result);
        
        // Add delay between messages to avoid rate limiting
        await this.delay(1000);
      } catch (error) {
        results.push({
          success: false,
          to: msg.to,
          error: error.message
        });
      }
    }

    return results;
  }

  async sendMediaMessage(to, mediaPath, caption = '') {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      const chatId = `${formattedNumber}@c.us`;
      
      const media = MessageMedia.fromFilePath(mediaPath);
      const sentMessage = await this.client.sendMessage(chatId, media, { caption });
      
      return {
        success: true,
        messageId: sentMessage.id._serialized,
        to: formattedNumber,
        type: 'media',
        caption: caption
      };
    } catch (error) {
      console.error('❌ Failed to send media message:', error);
      throw error;
    }
  }

  generateTicketMessage(type, ticketData) {
    const { id, title, priority, assignee, customer, dueDate, status } = ticketData;
    
    const templates = {
      created: `🎫 *New Ticket Created*\n\n` +
               `*ID:* ${id}\n` +
               `*Title:* ${title}\n` +
               `*Priority:* ${priority || 'Normal'}\n` +
               `*Customer:* ${customer || 'N/A'}\n` +
               `${dueDate ? `*Due Date:* ${dueDate}\n` : ''}` +
               `\n📋 Please check the ticket management system for more details.`,

      updated: `📝 *Ticket Updated*\n\n` +
               `*ID:* ${id}\n` +
               `*Title:* ${title}\n` +
               `*Status:* ${status}\n` +
               `*Priority:* ${priority || 'Normal'}\n` +
               `\n🔄 The ticket has been updated. Please check for latest changes.`,

      assigned: `👤 *Ticket Assigned*\n\n` +
                `*ID:* ${id}\n` +
                `*Title:* ${title}\n` +
                `*Assigned to:* ${assignee}\n` +
                `*Priority:* ${priority || 'Normal'}\n` +
                `${dueDate ? `*Due Date:* ${dueDate}\n` : ''}` +
                `\n⚡ Please review and start working on this ticket.`,

      resolved: `✅ *Ticket Resolved*\n\n` +
                `*ID:* ${id}\n` +
                `*Title:* ${title}\n` +
                `*Resolved by:* ${assignee}\n` +
                `\n🎉 The ticket has been marked as resolved.`,

      closed: `🔒 *Ticket Closed*\n\n` +
              `*ID:* ${id}\n` +
              `*Title:* ${title}\n` +
              `\n✨ This ticket has been closed and completed.`,

      reminder: `⏰ *Ticket Reminder*\n\n` +
                `*ID:* ${id}\n` +
                `*Title:* ${title}\n` +
                `*Assigned to:* ${assignee}\n` +
                `*Due Date:* ${dueDate}\n` +
                `\n🚨 This ticket is approaching its due date. Please update the status.`
    };

    return templates[type] || templates.created;
  }

  async sendAutoReply(message) {
    const autoReplies = [
      "Thank you for contacting our support team! 🎫",
      "We've received your message and will get back to you soon.",
      "For urgent issues, please create a ticket in our system.",
      "Have a great day! 😊"
    ];

    const reply = autoReplies.join('\n');
    
    try {
      await message.reply(reply);
      console.log('🤖 Auto-reply sent');
    } catch (error) {
      console.error('❌ Failed to send auto-reply:', error);
    }
  }

  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (default to +1 for US/Canada)
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    return cleaned;
  }

  async getChats() {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const chats = await this.client.getChats();
      return chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        lastMessage: chat.lastMessage?.body || '',
        timestamp: chat.timestamp
      }));
    } catch (error) {
      console.error('❌ Failed to get chats:', error);
      throw error;
    }
  }

  async getContactInfo(phone) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phone);
      const contact = await this.client.getContactById(`${formattedNumber}@c.us`);
      
      return {
        id: contact.id._serialized,
        name: contact.name || contact.pushname || formattedNumber,
        number: contact.number,
        isMyContact: contact.isMyContact,
        profilePicUrl: await contact.getProfilePicUrl()
      };
    } catch (error) {
      console.error('❌ Failed to get contact info:', error);
      return null;
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      hasQRCode: !!this.qrCode,
      qrCode: this.qrCode
    };
  }

  async logout() {
    try {
      await this.client.logout();
      this.isReady = false;
      this.qrCode = null;
      console.log('👋 WhatsApp client logged out');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
      throw error;
    }
  }

  async destroy() {
    try {
      await this.client.destroy();
      this.isReady = false;
      this.qrCode = null;
      console.log('🗑️ WhatsApp client destroyed');
    } catch (error) {
      console.error('❌ Failed to destroy client:', error);
      throw error;
    }
  }

  saveQRCode(qr) {
    try {
      const qrData = {
        qrCode: qr,
        timestamp: new Date(),
        expires: new Date(Date.now() + 60000) // QR expires in 1 minute
      };
      
      const qrPath = path.join(__dirname, '../data/qr-code.json');
      fs.writeFileSync(qrPath, JSON.stringify(qrData, null, 2));
    } catch (error) {
      console.error('❌ Failed to save QR code:', error);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WhatsAppService;