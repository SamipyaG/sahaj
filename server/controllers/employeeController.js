import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Designation from "../models/Designation.js";

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to safely populate employee data
const populateEmployeeData = async (employee) => {
  if (!employee) return null;

  // Convert to plain object if it's a Mongoose document
  employee = employee.toObject ? employee.toObject() : employee;

  // Manual population if needed
  if (!employee.department_id || typeof employee.department_id === 'string') {
    employee.department_id = await Department.findById(employee.department_id).select('department_name') || 
      { department_name: 'N/A' };
  }

  if (!employee.designation_id || typeof employee.designation_id === 'string') {
    employee.designation_id = await Designation.findById(employee.designation_id).select('title basic_salary') || 
      { title: 'N/A', basic_salary: 0 };
  }

  if (!employee.user_id || typeof employee.user_id === 'string') {
    employee.user_id = await User.findById(employee.user_id).select('name email role profileImage') || 
      { name: 'N/A', email: 'N/A', role: 'N/A', profileImage: 'default.png' };
  }

  return {
    ...employee,
    department_name: employee.department_id.department_name,
    designation_name: employee.designation_id.title,
    basic_salary: employee.designation_id.basic_salary,
    user: {
      name: employee.user_id.name,
      email: employee.user_id.email,
      role: employee.user_id.role,
      profileImage: employee.user_id.profileImage
    }
  };
};
const addEmployee = async (req, res) => {
  try {
    const requiredFields = [
      'employee_name', 'email', 'employee_id', 
      'department_id', 'designation_id', 'password', 'role'
    ];
    
    // Validate required fields
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Trim and validate employee_id
    const employee_id = req.body.employee_id ? req.body.employee_id.toString().trim() : null;
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: "Employee ID cannot be empty"
      });
    }

    const { email, password } = req.body;

    // Check for existing records with more strict validation
    const [existingUser, existingEmployee] = await Promise.all([
      User.findOne({ email: email.trim() }),
      Employee.findOne({ employee_id })
    ]);

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: "Email already exists" 
      });
    }

    if (existingEmployee) {
      return res.status(400).json({ 
        success: false, 
        error: "Employee ID already exists" 
      });
    }

    // Create user first
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: req.body.employee_name.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: req.body.role,
      profileImage: req.file?.filename || "default.png"
    });

    const savedUser = await newUser.save();

    // Create employee with validated data
    const newEmployee = new Employee({
      employee_id,
      employee_name: req.body.employee_name.trim(),
      user_id: savedUser._id,
      department_id: req.body.department_id,
      designation_id: req.body.designation_id,
      date_of_birth: req.body.date_of_birth || null,
      gender: req.body.gender || null,
      marital_status: req.body.marital_status || null
    });

    const savedEmployee = await newEmployee.save();
    const populatedEmployee = await populateEmployeeData(savedEmployee);

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: populatedEmployee
    });

  } catch (error) {
    console.error("Error in addEmployee:", error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Employee ID must be unique",
        details: "The provided employee ID already exists or is invalid"
      });
    }
    
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};

// Get all employees
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('department_id', 'department_name')
      .populate('designation_id', 'title basic_salary')
      .populate('user_id', 'name email role profileImage');

    const processedEmployees = await Promise.all(
      employees.map(emp => populateEmployeeData(emp))
    );

    return res.status(200).json({
      success: true,
      count: processedEmployees.length,
      data: processedEmployees
    });
  } catch (error) {
    console.error("Error in getEmployees:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch employees",
      details: error.message
    });
  }
};

// Get single employee
const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findOne({
      $or: [
        { _id: id },
        { employee_id: id },
        { user_id: id }
      ]
    })
    .populate('department_id', 'department_name')
    .populate('designation_id', 'title basic_salary')
    .populate('user_id', 'name email role profileImage');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    const populatedEmployee = await populateEmployeeData(employee);
    return res.status(200).json({
      success: true,
      data: populatedEmployee
    });

  } catch (error) {
    console.error("Error in getEmployee:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch employee",
      details: error.message
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove restricted fields
    delete updates.employee_id;
    delete updates.user_id;
    delete updates.join_date;

    // Update user if name changed
    if (updates.employee_name) {
      const employee = await Employee.findById(id);
      if (employee) {
        await User.findByIdAndUpdate(employee.user_id, {
          name: updates.employee_name
        });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('department_id', 'department_name')
    .populate('designation_id', 'title basic_salary')
    .populate('user_id', 'name email role profileImage');

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    const populatedEmployee = await populateEmployeeData(updatedEmployee);
    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: populatedEmployee
    });

  } catch (error) {
    console.error("Error in updateEmployee:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update employee",
      details: error.message
    });
  }
};

// Get employees by department
const fetchEmployeesByDepId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify department exists
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    const employees = await Employee.find({ department_id: id })
      .populate('designation_id', 'title basic_salary')
      .populate('user_id', 'name email role profileImage');

    const processedEmployees = await Promise.all(
      employees.map(emp => populateEmployeeData(emp))
    );

    return res.status(200).json({
      success: true,
      department: department.department_name,
      count: processedEmployees.length,
      data: processedEmployees
    });

  } catch (error) {
    console.error("Error in fetchEmployeesByDepId:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch department employees",
      details: error.message
    });
  }
};

export { 
  addEmployee, 
  upload, 
  getEmployees, 
  getEmployee, 
  updateEmployee, 
  fetchEmployeesByDepId 
};