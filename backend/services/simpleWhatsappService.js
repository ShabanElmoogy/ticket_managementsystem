import pkg from '@whiskeysockets/baileys';
const { 
  default: makeWASocket,
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion
} = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleWhatsAppService {
  constructor() {
    this.sock = null;
    this.isReady = false;
    this.qrCode = null;
    this.isInitializing = false;
    this.sessionPath = path.join(__dirname, '../data/simple-session');
    
    // Ensure session directory exists
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
    
    console.log('🚀 Simple WhatsApp Service initialized');
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⚠️ Already initializing...');
      return;
    }

    console.log('🔄 Starting simple WhatsApp initialization...');
    this.isInitializing = true;
    this.isReady = false;
    this.qrCode = null;

    try {
      // Get latest version
      const { version } = await fetchLatestBaileysVersion();
      console.log(`📱 Using WhatsApp v${version.join('.')}`);

      // Load auth state
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      // Create socket with minimal config
      this.sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
        browser: ['Ticket Management', 'Chrome', '1.0.0']
      });

      // Handle QR code
      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        console.log('Connection update:', connection);

        if (qr) {
          console.log('📱 QR Code received!');
          this.qrCode = qr;
        }

        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('Connection closed. Should reconnect:', shouldReconnect);
          
          if (shouldReconnect) {
            this.initialize();
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp connected!');
          this.isReady = true;
          this.qrCode = null;
        }
        
        this.isInitializing = false;
      });

      // Save credentials
      this.sock.ev.on('creds.update', saveCreds);

      console.log('✅ Socket created successfully');

    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  async sendMessage(to, message) {
    if (!this.isReady || !this.sock) {
      throw new Error('WhatsApp is not ready');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      const jid = `${formattedNumber}@s.whatsapp.net`;

      const result = await this.sock.sendMessage(jid, { text: message });

      return {
        success: true,
        messageId: result.key.id,
        to: formattedNumber,
        message: message
      };
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
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
      isConnecting: false,
      connectionAttempts: 0
    };
  }

  async logout() {
    try {
      if (this.sock) {
        await this.sock.logout();
      }
      this.cleanup();
    } catch (error) {
      console.error('Logout error:', error);
      this.cleanup();
    }
  }

  async destroy() {
    this.cleanup();
  }

  cleanup() {
    this.isReady = false;
    this.isInitializing = false;
    this.qrCode = null;
    
    if (this.sock) {
      this.sock.end();
      this.sock = null;
    }
  }

  async clearSession() {
    try {
      this.cleanup();
      
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
      }
      
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }
      
      await this.initialize();
    } catch (error) {
      console.error('Failed to clear session:', error);
      throw error;
    }
  }
}

export default SimpleWhatsAppService;