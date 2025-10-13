import pkg from '@whiskeysockets/baileys';
const { 
  default: makeWASocket,
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import P from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BaileysWhatsAppService {
  constructor() {
    this.sock = null;
    this.isReady = false;
    this.qrCode = null;
    this.isInitializing = false;
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.sessionPath = path.join(__dirname, '../data/baileys-session');
    this.logger = P({ level: 'silent' });
    
    this.ensureSessionDirectory();
    console.log('🚀 Baileys WhatsApp Service initialized');
  }

  ensureSessionDirectory() {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⚠️ Already initializing...');
      return;
    }

    console.log('🔄 Starting Baileys WhatsApp initialization...');
    this.isInitializing = true;
    this.isReady = false;
    this.qrCode = null;
    this.isConnecting = false;

    try {
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`📱 Using WhatsApp v${version.join('.')}, isLatest: ${isLatest}`);

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      this.sock = makeWASocket({
        version,
        logger: this.logger,
        printQRInTerminal: true,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, this.logger),
        },
        browser: ['Ticket Management System', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        console.log('🔄 Connection update:', connection);

        if (qr) {
          console.log('📱 QR Code received - ready for scanning');
          this.qrCode = qr;
          this.isInitializing = false;
        }

        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('Connection closed. Should reconnect:', shouldReconnect);
          
          this.isReady = false;
          this.isConnecting = false;
          this.qrCode = null;
          this.isInitializing = false;

          if (shouldReconnect) {
            setTimeout(() => this.initialize(), 5000);
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp connected successfully!');
          this.isReady = true;
          this.isConnecting = false;
          this.isInitializing = false;
          this.qrCode = null;
          this.connectionAttempts = 0;
        } else if (connection === 'connecting') {
          console.log('🔗 Connecting to WhatsApp...');
          this.isConnecting = true;
        }
      });

      this.sock.ev.on('creds.update', saveCreds);

      console.log('✅ Baileys socket created successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Baileys:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  async sendMessage(to, message) {
    if (!this.isReady || !this.sock) {
      throw new Error('WhatsApp is not ready. Please scan QR code first.');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      const jid = `${formattedNumber}@s.whatsapp.net`;

      console.log(`📤 Sending message to ${formattedNumber}`);

      const sentMessage = await this.sock.sendMessage(jid, { text: message });

      console.log(`✅ Message sent successfully to ${formattedNumber}`);

      return {
        success: true,
        messageId: sentMessage.key.id,
        to: formattedNumber,
        message: message,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to send message:', error);
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
        
        await new Promise(resolve => setTimeout(resolve, 1000));
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

      assigned: `👤 *Ticket Assigned*\n\n` +
                `*ID:* ${id}\n` +
                `*Title:* ${title}\n` +
                `*Assigned to:* ${assignee}\n` +
                `*Priority:* ${priority || 'Normal'}\n` +
                `${dueDate ? `*Due Date:* ${dueDate}\n` : ''}` +
                `\n⚡ Please review and start working on this ticket.`,

      status_changed: `📝 *Ticket Status Updated*\n\n` +
                      `*ID:* ${id}\n` +
                      `*Title:* ${title}\n` +
                      `*Status:* ${status}\n` +
                      `*Priority:* ${priority || 'Normal'}\n` +
                      `\n🔄 The ticket status has been changed.`
    };

    return templates[type] || templates.created;
  }

  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
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
      isConnecting: this.isConnecting,
      connectionAttempts: this.connectionAttempts
    };
  }

  async logout() {
    try {
      console.log('👋 Logging out...');
      if (this.sock) {
        await this.sock.logout();
      }
      this.cleanup();
    } catch (error) {
      console.error('❌ Logout error:', error);
      this.cleanup();
    }
  }

  async destroy() {
    try {
      console.log('🗑️ Destroying service...');
      this.cleanup();
    } catch (error) {
      console.error('❌ Destroy error:', error);
    }
  }

  cleanup() {
    this.isReady = false;
    this.isInitializing = false;
    this.isConnecting = false;
    this.qrCode = null;
    this.connectionAttempts = 0;
    
    if (this.sock) {
      this.sock.end();
      this.sock = null;
    }
  }

  async clearSession() {
    try {
      console.log('🧹 Clearing session...');
      
      this.cleanup();
      
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
      }
      
      this.ensureSessionDirectory();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.initialize();
      
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
      throw error;
    }
  }

  async checkNumberExists(phone) {
    if (!this.isReady || !this.sock) {
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phone);
      const jid = `${formattedNumber}@s.whatsapp.net`;
      
      const [result] = await this.sock.onWhatsApp(jid);
      return result?.exists || false;
    } catch (error) {
      console.error('❌ Failed to check number:', error);
      return false;
    }
  }
}

export default BaileysWhatsAppService;