import express from 'express';
import authMiddleware from '../middleware/authMiddlware.js'
import { addDesignation, getDesignations, getDesignationById, updateDesignation, deleteDesignation } from '../controllers/designationController.js';

const router = express.Router();

router.get('/', authMiddleware, getDesignations);
router.post('/add', authMiddleware, addDesignation);
router.get('/:id', authMiddleware, getDesignationById);
router.put('/:id', authMiddleware, updateDesignation);
router.delete('/:id', authMiddleware, deleteDesignation);

export default router;
