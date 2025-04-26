import express from 'express';
import authMiddleware from '../middleware/authMiddlware.js';
import {
  addLeaveSetup,
  getLeaveSetups,
  getLeaveSetup,
  updateLeaveSetup,
  deleteLeaveSetup
} from '../controllers/leavesetupController.js';

const router = express.Router();

// Get all leave setups
router.get('/', authMiddleware, getLeaveSetups);

// Add a new leave setup
router.post('/add', authMiddleware, addLeaveSetup);

// Get a single leave setup by ID
router.get('/:id', authMiddleware, getLeaveSetup);

// Update a leave setup
router.put('/:id', authMiddleware, updateLeaveSetup);

// Delete a leave setup
router.delete('/:id', authMiddleware, deleteLeaveSetup);

export default router;