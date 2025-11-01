import express from 'express';
import authRoutes from './auth/auth.routes.js';
import ticketRoutes from './tickets/tickets.routes.js';
import applicationRoutes from './applications/applications.routes.js';
import commentRoutes from './comments/comments.routes.js';
import customerRoutes from './customers/customers.routes.js';
import dashboardRoutes from './dashboard/dashboard.routes.js';
import kanbanRoutes from './kanban/kanban.routes.js';
import labelRoutes from './labels/labels.routes.js';
import notificationRoutes from './notifications/notifications.routes.js';
import taskRoutes from './tasks/tasks.routes.js';
import userRoutes from './users/users.routes.js';
import reminderRoutes from './reminders/reminders.routes.js';
import docRoutes from './docs/docs.routes.js';

const router = express.Router();

// Module routes
router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/applications', applicationRoutes);
router.use('/customers', customerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/kanban', kanbanRoutes);
router.use('/labels', labelRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);
router.use('/reminders', reminderRoutes);
router.use('/tickets', commentRoutes);
router.use('/docs', docRoutes);
router.use('/docsbuilder', docRoutes);

export default router;