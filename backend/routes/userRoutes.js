import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// User Routes
router.get('/', authenticateToken, requireAdmin, userController.getAllUsers);
router.get('/stats', authenticateToken, requireAdmin, userController.getUserStats);
router.get('/employees', authenticateToken, userController.getEmployees);
router.get('/:id', authenticateToken, requireAdmin, userController.getUserById);
router.post('/', authenticateToken, requireAdmin, userController.createUser);
router.get('/profile', authenticateToken, userController.getCurrentProfile);
router.put('/profile', authenticateToken, userController.updateOwnProfile);
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);

export default router;