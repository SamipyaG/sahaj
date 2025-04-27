import express from 'express';
import authMiddleware from '../middleware/authMiddlware.js';
import { initSalaryCronJob, getEmployeeSalaries, getOverallSalaryStatus} from '../controllers/salaryController.js';

const router = express.Router();

// Route to add a new salary record automatically
router.post('/add', authMiddleware, initSalaryCronJob);

// Route to add a new salary record automatically
router.post('/paidStatus', authMiddleware, getOverallSalaryStatus);

// Route to get salary details for a specific employee by ID
router.get('/:id', authMiddleware, getEmployeeSalaries);


export default router;
