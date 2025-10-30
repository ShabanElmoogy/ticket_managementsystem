import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Serve frontend for all non-API routes
  app.get('*', (req, res) => {
    // If it's an API route, return 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve frontend index.html for all other routes
    const frontendPath = path.join(__dirname, '../../../frontend/dist/index.html');
    res.sendFile(frontendPath, (err) => {
      if (err) {
        res.json({
          name: 'Ticket Management API',
          status: 'OK',
          health: '/api/health',
          note: 'Frontend not built. Run: cd frontend && npm run build'
        });
      }
    });
  });
}