#!/usr/bin/env node

/**
 * Standalone WhatsApp service starter
 * Run this script to start WhatsApp integration independently
 */

const WhatsAppService = require('../services/whatsappService');
const express = require('express');
const cors = require('cors');
const whatsappRoutes = require('../routes/whatsappRoutes');

const app = express();
const PORT = process.env.WHATSAPP_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/whatsapp', whatsappRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'WhatsApp Integration',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('WhatsApp Service Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Service running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/whatsapp`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('  POST /api/whatsapp/initialize - Initialize WhatsApp client');
  console.log('  GET  /api/whatsapp/status - Get connection status');
  console.log('  GET  /api/whatsapp/qr-code - Get QR code for scanning');
  console.log('  POST /api/whatsapp/send-message - Send a message');
  console.log('  POST /api/whatsapp/send-ticket-notification - Send ticket notification');
  console.log('  POST /api/whatsapp/logout - Logout WhatsApp');
  console.log('');
  console.log('🎯 To get started:');
  console.log('  1. POST to /api/whatsapp/initialize');
  console.log('  2. GET /api/whatsapp/qr-code and scan with WhatsApp');
  console.log('  3. Start sending messages!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WhatsApp service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WhatsApp service...');
  process.exit(0);
});