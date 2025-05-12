import express from 'express';
import {
  getPaidStatus,
  getEmployeeSalaries,
  testSalaryGeneration,
  getMonthlySalaryDetails
} from '../controllers/salaryController.js';
import authMiddleware from '../middleware/authMiddlware.js';

const router = express.Router();

// Test endpoint to manually trigger salary generation (Admin only)
router.post(
  '/test-generate',
  authMiddleware,
  testSalaryGeneration
);

// Get monthly salary details
router.get(
  '/monthly/:year/:month',
  authMiddleware,
  getMonthlySalaryDetails
);

// Get overall salary payment status (Admin/HR only)
router.get(
  '/paidStatus',
  authMiddleware, getPaidStatus
);

// Get employee salary history (accessible by employee or admin/hr)
router.get(
  '/:id',
  authMiddleware, getEmployeeSalaries
);

export default router;