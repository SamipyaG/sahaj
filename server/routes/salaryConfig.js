import express from 'express';
import { getSalaryConfig, updateSalaryConfig } from '../controllers/salaryConfigController.js';
import authMiddleware from '../middleware/authMiddlware.js';
import authorize from '../middleware/authorizeMiddleware.js';

const router = express.Router();

// Get current configuration (Admin only)
router.get(
  '/',
  authMiddleware,
  authorize(['admin']),
  getSalaryConfig
);

// Update configuration (Admin only)
router.put(
  '/',
  authMiddleware,
  authorize(['admin']),
  updateSalaryConfig
);

export default router;