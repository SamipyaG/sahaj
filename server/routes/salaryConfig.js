import express from 'express';
import { getSalaryConfig, updateSalaryConfig } from '../controllers/salaryConfigController.js';
import authMiddleware from '../middleware/authMiddlware.js';
import authorize from '../middleware/authorizeMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for configuration updates
const configLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: 'Too many configuration update attempts'
});

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
  configLimiter,
  updateSalaryConfig
);

export default router;