const express = require('express');
const router = express.Router();
const leaveHandoverController = require('../controllers/leaveHandoverController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Create a new handover (both admin and employee)
router.post('/', authenticateToken, leaveHandoverController.createHandover);

// Admin-specific route to create handover
router.post('/admin', authenticateToken, isAdmin, leaveHandoverController.createHandover);

// Update handover status (accept/reject)
router.put('/:handoverId/status', authenticateToken, leaveHandoverController.updateHandoverStatus);

// Get handover history for the current user
router.get('/history', authenticateToken, leaveHandoverController.getHandoverHistory);

// Admin route to get all handovers
router.get('/admin/all', authenticateToken, isAdmin, leaveHandoverController.getAllHandovers);

module.exports = router; 