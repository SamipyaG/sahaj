import express from "express";
import authMiddleware from "../middleware/authMiddlware.js";
import {
  addDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";
import Department from "../models/Department.js"; // Import Department model

const router = express.Router();

// Get all departments
router.get("/", authMiddleware, getDepartments);

// Add a new department
router.post("/add", authMiddleware, addDepartment);

// Get a single department by ID
router.get("/:id", authMiddleware, getDepartment);

// Update a department by ID
router.put("/:id", authMiddleware, updateDepartment);

// Delete a department by ID
router.delete("/:id", authMiddleware, deleteDepartment);

// ✅ Check if department ID is unique before adding
router.get("/check-id/:id", authMiddleware, async (req, res) => {
  try {
    const department = await Department.findOne({ department_id: req.params.id });
    if (department) {
      return res.json({ available: false, message: "Department ID already exists." });
    }
    return res.json({ available: true });
  } catch (error) {
    console.error("Error checking department ID:", error);
    return res.status(500).json({ success: false, error: "Error checking department ID" });
  }
});

export default router;