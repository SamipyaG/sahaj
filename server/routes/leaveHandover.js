import express from 'express';
import authMiddleware from '../middleware/authMiddlware.js';
import {
  createLeaveHandover,
  createAdminLeaveHandover,
  updateHandoverStatus,
  getHandoverHistory,
  getAllHandovers
} from '../controllers/leaveHandoverController.js';

const router = express.Router();

// Employee routes
router.post('/', authMiddleware, createLeaveHandover);
router.get('/history', authMiddleware, getHandoverHistory);
router.put('/:id/status', authMiddleware, updateHandoverStatus);

// Admin routes
router.post('/admin', authMiddleware, createAdminLeaveHandover);
router.get('/admin/all', authMiddleware, getAllHandovers);

export default router;
