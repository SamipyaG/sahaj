import express from 'express';
import authMiddleware from '../middleware/authMiddlware.js';
import {
  addLeave,
  getLeave,
  getLeaves,
  getLeaveDetail,
  updateLeave,
  getLeaveHistory,
  getLeaveStats,
  getEmployeeLeaveStats,
  getOverallEmployeeLeaveStats
} from '../controllers/leaveController.js';

const router = express.Router();

// Route to get leave statistics (must be before the /:id/:role route)
router.get('/stats', authMiddleware, getLeaveStats);

// Route to get employee-specific leave statistics
router.get('/stats/employee/:userId', authMiddleware, getEmployeeLeaveStats);

// Route to get overall employee leave statistics
router.get('/stats/overall', authMiddleware, getOverallEmployeeLeaveStats);

// Route to get leave history for balance calculation
router.get('/history/:userId/:leaveSetupId', authMiddleware, getLeaveHistory);

// Route to get leave details (must be before /:id/:role)
router.get('/details/:id', authMiddleware, getLeaveDetail);

// Route to get all leave requests (admin access)
router.get('/', authMiddleware, getLeaves);

// Route to get leave requests based on user ID and role
router.get('/:id/:role', authMiddleware, getLeave);

// Route to update leave status
router.put('/:id', authMiddleware, updateLeave);

export default router;
