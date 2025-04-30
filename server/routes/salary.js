import express from 'express';
import {
  getPaidStatus,
  getEmployeeSalaries
} from '../controllers/salaryController.js';
import authMiddleware from '../middleware/authMiddlware.js';
import authorize from '../middleware/authorizeMiddleware.js';

const router = express.Router();

// Get overall salary payment status (Admin/HR only)
router.get(
  '/paidStatus', 
  authMiddleware, 
  authorize(['admin']), 
  getPaidStatus
);

// Get employee salary history (accessible by employee or admin/hr)
router.get(
  '/:id', 
  authMiddleware, 
  authorize(['admin', 'employee'], true), 
  getEmployeeSalaries
);

export default router;