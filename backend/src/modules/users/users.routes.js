import express from 'express';
import * as usersController from './users.controller.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

// User Routes
router.get('/', authenticateToken, requireAdmin, usersController.getAllUsers);
router.get('/stats', authenticateToken, requireAdmin, usersController.getUserStats);
router.get('/employees', authenticateToken, usersController.getEmployees);
router.get('/:id', authenticateToken, requireAdmin, usersController.getUserById);
router.post('/', authenticateToken, requireAdmin, usersController.createUser);
router.get('/profile', authenticateToken, usersController.getCurrentProfile);
router.put('/profile', authenticateToken, usersController.updateOwnProfile);
router.put('/:id', authenticateToken, requireAdmin, usersController.updateUser);
router.delete('/:id', authenticateToken, requireAdmin, usersController.deleteUser);

export default router;