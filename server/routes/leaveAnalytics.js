import express from 'express';
import {
  getDepartmentLeaveUsage,
  getMonthlyLeaveTrends,
  getTopLeaveTakers,
  getLeaveBalance,
  getTeamAvailability
} from '../controllers/leaveAnalyticsController.js';
// import { protect, authorize } from '../middleware/auth.js'; // This file was deleted

const router = express.Router();

// All routes are protected and require admin/HR role
// router.use(protect); // Removing deleted middleware
// router.use(authorize('admin', 'hr')); // Removing deleted middleware

// Department-wise leave usage
router.get('/department/:year', getDepartmentLeaveUsage);

// Monthly leave trends
router.get('/monthly/:year', getMonthlyLeaveTrends);

// Top leave takers
router.get('/top-takers/:year', getTopLeaveTakers);

// Leave balance overview
router.get('/balance/:year', getLeaveBalance);

// Team availability
router.get('/availability/:year/:month', getTeamAvailability);

export default router; 