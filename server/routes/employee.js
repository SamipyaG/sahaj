import express from "express";
import { addEmployee, getEmployees, getEmployee, updateEmployee, fetchEmployeesByDepId, upload } from "../controllers/employeeController.js";

const router = express.Router();

// Route to add a new employee
router.post("/add", upload.single("image"), addEmployee);

// Route to get all employees
router.get("/", getEmployees);

// Route to get a specific employee by ID or user ID
router.get("/:id", getEmployee);

// Route to update an employee's details
router.put("/:id", updateEmployee);

// Route to fetch employees by department ID
router.get("/department/:id", fetchEmployeesByDepId);

export default router;
