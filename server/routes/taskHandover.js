import express from "express";
import {
  createHandover,
  adminCreateHandover,
  respondToHandover,
  getEmployeeHandovers,
  getLeaveHandovers
} from "../controllers/taskHandoverController.js";
import { verifyToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Employee routes
router.post("/", verifyToken, createHandover);
router.put("/:id/respond", verifyToken, respondToHandover);
router.get("/employee/:id", verifyToken, getEmployeeHandovers);
router.get("/leave/:id", verifyToken, getLeaveHandovers);

// Admin routes
router.post("/admin", verifyToken, checkRole("admin"), adminCreateHandover);

export default router; 