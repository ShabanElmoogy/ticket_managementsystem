const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

class WorkingWhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.isInitializing = false;
    this.sessionPath = path.join(__dirname, '../data/working-session');
    
    // Ensure session directory exists
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
    
    console.log('🚀 Working WhatsApp Service initialized');
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⚠️ Already initializing...');
      return;
    }

    console.log('🔄 Starting WhatsApp initialization...');
    this.isInitializing = true;
    this.isReady = false;
    this.qrCode = null;

    try {
      // Create client with LocalAuth
      this.client = new Client({
        authStrategy: new LocalAuth({
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
            '--disable-gpu'
          ]
        }
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Initialize client
      await this.client.initialize();
      
      console.log('✅ Client initialization started');

    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  setupEventHandlers() {
    // QR code event
    this.client.on('qr', (qr) => {
      console.log('📱 QR Code generated!');
      this.qrCode = qr;
      this.isInitializing = false;
      
      // Display QR in terminal
      qrcode.generate(qr, { small: true });
      console.log('Scan the QR code above with your WhatsApp mobile app');
    });

    // Ready event
    this.client.on('ready', () => {
      console.log('✅ WhatsApp Client is ready!');
      this.isReady = true;
      this.isInitializing = false;
      this.qrCode = null;
    });

    // Authenticated event
    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp Client authenticated successfully');
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication failed:', msg);
      this.isReady = false;
      this.isInitializing = false;
    });

    // Disconnected event
    this.client.on('disconnected', (reason) => {
      console.log('📱 WhatsApp Client disconnected:', reason);
      this.isReady = false;
      this.isInitializing = false;
      this.qrCode = null;
    });

    // Error event
    this.client.on('error', (error) => {
      console.error('❌ WhatsApp Client error:', error);
      this.isInitializing = false;
    });
  }

  async sendMessage(to, message) {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready. Please scan QR code first.');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      const chatId = `${formattedNumber}@c.us`;

      console.log(`📤 Sending message to ${formattedNumber}`);
      
      const result = await this.client.sendMessage(chatId, message);

      console.log(`✅ Message sent successfully to ${formattedNumber}`);

      return {
        success: true,
        messageId: result.id.id,
        to: formattedNumber,
        message: message,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
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

  getStatus() {
    return {
      isReady: this.isReady,
      hasQRCode: !!this.qrCode,
      qrCode: this.qrCode,
      isInitializing: this.isInitializing,
      isConnecting: false,
      connectionAttempts: 0
    };
  }

  async logout() {
    try {
      console.log('👋 Logging out...');
      if (this.client) {
        await this.client.logout();
      }
      this.cleanup();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      this.cleanup();
    }
  }

  async destroy() {
    try {
      console.log('🗑️ Destroying service...');
      this.cleanup();
      if (this.client) {
        await this.client.destroy();
      }
      console.log('✅ Service destroyed');
    } catch (error) {
      console.error('❌ Destroy error:', error);
    }
  }

  cleanup() {
    this.isReady = false;
    this.isInitializing = false;
    this.qrCode = null;
  }

  async clearSession() {
    try {
      console.log('🧹 Clearing session...');
      
      this.cleanup();
      
      if (this.client) {
        await this.client.destroy();
        this.client = null;
      }
      
      // Clear session files
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
        console.log('🗑️ Session files cleared');
      }
      
      // Recreate session directory
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }
      
      // Wait before reinitializing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Reinitialize
      await this.initialize();
      
      console.log('✅ Session cleared and reinitialized');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
      throw error;
    }
  }
}

module.exports = WorkingWhatsAppService;