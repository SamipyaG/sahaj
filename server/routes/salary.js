import express from 'express';
import authMiddleware from '../middleware/authMiddlware.js';
import { addSalary, getSalary, autoPaySalaries } from '../controllers/salaryController.js';

const router = express.Router();

// Route to add a new salary record (manual addition)
router.post('/add', authMiddleware, addSalary);

// Route to get salary details for a specific employee by ID
router.get('/:id', authMiddleware, getSalary);

// Route to automatically generate and pay salary slips for all employees
router.post('/auto-pay', authMiddleware, autoPaySalaries);

export default router;
