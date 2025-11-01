import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { listDocs, getDoc, createDoc, updateDoc, deleteDoc, listTree, createFolder, createDocNode, renameNode, moveNode, deleteNode } from './docs.controller.js';

const router = express.Router();

router.get('/', authenticateToken, listDocs);
router.get('/:id', authenticateToken, getDoc);
router.post('/', authenticateToken, createDoc);
router.put('/:id', authenticateToken, updateDoc);
router.delete('/:id', authenticateToken, deleteDoc);

router.get('/tree/list', authenticateToken, listTree);
router.post('/tree/folder', authenticateToken, createFolder);
router.post('/tree/doc', authenticateToken, createDocNode);
router.put('/tree/:id/rename', authenticateToken, renameNode);
router.put('/tree/:id/move', authenticateToken, moveNode);
router.delete('/tree/:id', authenticateToken, deleteNode);

export default router;