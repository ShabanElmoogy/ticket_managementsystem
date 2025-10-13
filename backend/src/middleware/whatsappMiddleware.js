const WhatsAppService = require('../services/whatsappService');

// Middleware to check if WhatsApp is ready
const checkWhatsAppReady = (req, res, next) => {
  const whatsappService = req.app.locals.whatsappService;
  
  if (!whatsappService || !whatsappService.isReady) {
    return res.status(503).json({
      success: false,
      message: 'WhatsApp service is not ready. Please initialize and scan QR code first.',
      code: 'WHATSAPP_NOT_READY'
    });
  }
  
  next();
};

// Middleware to validate phone number
const validatePhoneNumber = (req, res, next) => {
  const { to } = req.body;
  
  if (!to) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }
  
  // Basic phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const cleanPhone = to.replace(/\D/g, '');
  
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }
  
  next();
};

// Middleware to rate limit WhatsApp messages
const rateLimitMessages = (req, res, next) => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxMessages = 10; // Max 10 messages per minute
  
  if (!req.app.locals.messageRateLimit) {
    req.app.locals.messageRateLimit = new Map();
  }
  
  const clientId = req.ip || 'unknown';
  const clientData = req.app.locals.messageRateLimit.get(clientId) || { count: 0, resetTime: now + windowMs };
  
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + windowMs;
  }
  
  if (clientData.count >= maxMessages) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please wait before sending more messages.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  req.app.locals.messageRateLimit.set(clientId, clientData);
  
  next();
};

// Middleware to log WhatsApp activities
const logWhatsAppActivity = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the activity
    console.log(`[WhatsApp] ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  checkWhatsAppReady,
  validatePhoneNumber,
  rateLimitMessages,
  logWhatsAppActivity
};