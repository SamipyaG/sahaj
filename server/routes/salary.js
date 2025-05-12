import express from 'express';
import {
  getPaidStatus,
  getEmployeeSalaries
} from '../controllers/salaryController.js';
import authMiddleware from '../middleware/authMiddlware.js';


const router = express.Router();

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