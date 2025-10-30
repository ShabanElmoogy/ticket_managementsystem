import express from 'express';

// Routers
import authRoutes from '../../routes/authRoutes.js';
import userRoutes from '../../routes/userRoutes.js';
import ticketRoutes from '../../routes/ticketRoutes.js';
import taskRoutes from '../../routes/taskRoutes.js';
import dashboardRoutes from '../../routes/dashboardRoutes.js';
import customerRoutes from '../../routes/customerRoutes.js';
import applicationRoutes from '../../routes/applicationRoutes.js';
import kanbanRoutes from '../../routes/kanbanRoutes.js';
import labelRoutes from '../../routes/labelRoutes.js';
import notificationRoutes from '../../routes/notificationRoutes.js';
import whatsappRoutes from '../../routes/whatsappRoutes.js';
import docRoutes from '../../routes/docRoutes.js';

export function registerRoutes(app) {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/kanban', kanbanRoutes);
  app.use('/api/labels', labelRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/docsbuilder', docRoutes);
  app.use('/api', docRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Friendly root landing for API-only service
  app.get('/', (req, res) => {
    res.json({
      name: 'Ticket Management API',
      status: 'OK',
      health: '/api/health',
      docs: 'Set service health check to /api/health; frontend served separately.'
    });
  });
}