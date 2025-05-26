import express from "express";
import {
  addEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  fetchEmployeesByDepId,
  upload,
  getEmployeeCount,
  getLatestEmployeeId,
  deleteEmployee
} from "../controllers/employeeController.js";
import authMiddleware from "../middleware/authMiddlware.js";

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authMiddleware);

// Route to add a new employee
router.post("/add", upload.single("image"), addEmployee);

// Route to get the latest employee ID for generating new IDs
router.get("/latest-id", getLatestEmployeeId);

// Route to get total employee count
router.get("/count/total", getEmployeeCount);

// Route to fetch employees by department ID
router.get("/department/:id", fetchEmployeesByDepId);

// Route to get all employees
router.get("/", getEmployees);

// Route to get a specific employee by ID or user ID
router.get("/:id", getEmployee);

// Route to update an employee's details
router.put("/:id", updateEmployee);

// Route to delete an employee
router.delete("/:id", deleteEmployee);

export default router;