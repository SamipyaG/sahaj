import express from 'express'
import { login, verify, requestPasswordResetOTP, resetPassword } from '../controllers/authController.js'
import authMiddleware from '../middleware/authMiddlware.js'

const router = express.Router()

router.post('/login', login)
router.get('/verify', authMiddleware, verify)

// New routes for password reset
router.post('/request-reset-otp', requestPasswordResetOTP)
router.post('/reset-password', resetPassword)

export default router;