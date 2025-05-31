import express from "express";
import { login, logout, register, verify, forgotPassword, resetPassword } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/logout
router.post("/logout", verifyToken, logout);

// GET /api/auth/verify
router.get("/verify", verifyToken, verify);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", resetPassword);

export default router; 