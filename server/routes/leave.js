import express from 'express';
import authMiddleware from '../middleware/authMiddlware.js';
import { addLeave, getLeave, getLeaves, getLeaveDetail, updateLeave } from '../controllers/leaveController.js';

const router = express.Router();

// Route to add a new leave request
router.post('/add', authMiddleware, addLeave);

// Route to get details of a specific leave request
router.get('/detail/:id', authMiddleware, getLeaveDetail);

// Route to get leave requests based on user ID and role
router.get('/:id/:role', authMiddleware, getLeave);

// Route to get all leave requests (admin access)
router.get('/', authMiddleware, getLeaves);

// Route to update leave status (e.g., Approve or Reject)
router.put('/:id', authMiddleware, updateLeave);

export default router;
