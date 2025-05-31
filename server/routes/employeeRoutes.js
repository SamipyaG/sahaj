import express from "express";
import { addEmployee, upload, getEmployees, getEmployee, updateEmployee, fetchEmployeesByDepId, getEmployeeCount, getLatestEmployeeId, getEmployeeByUserId, deleteEmployee } from "../controllers/employeeController.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

// Add new employee
router.post("/", verifyToken, verifyAdmin, upload.single("profileImage"), addEmployee);

// Get all employees
router.get("/", verifyToken, getEmployees);

// Get employee by ID
router.get("/:id", verifyToken, getEmployee);

// Update employee
router.put("/:id", verifyToken, updateEmployee);

// Get employees by department ID
router.get("/department/:id", verifyToken, fetchEmployeesByDepId);

// Get employee count
router.get("/count", verifyToken, getEmployeeCount);

// Get latest employee ID
router.get("/latest/id", verifyToken, getLatestEmployeeId);

// Get employee by user ID
router.get("/user/:userId", verifyToken, getEmployeeByUserId);

// Delete employee
router.delete("/:id", verifyToken, verifyAdmin, deleteEmployee);

export default router; 