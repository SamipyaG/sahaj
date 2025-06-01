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
      'employee_name', 'email',
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

    // Validate age if date_of_birth is provided
    if (req.body.date_of_birth) {
      const dob = new Date(req.body.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      // Adjust age if birthday hasn't occurred this year
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
        ? age - 1
        : age;

      if (adjustedAge < 21) {
        return res.status(400).json({
          success: false,
          error: "Employee must be at least 21 years old"
        });
      }
    }

    const { email, password, department_id, designation_id } = req.body;

    // Fetch Department and Designation details
    const department = await Department.findById(department_id);
    const designation = await Designation.findById(designation_id);

    if (!department) {
      return res.status(400).json({ success: false, error: "Invalid Department ID" });
    }
    if (!designation) {
      return res.status(400).json({ success: false, error: "Invalid Designation ID" });
    }

    // Generate employeeId
    const totalEmployees = await Employee.countDocuments();
    const employeeNumber = totalEmployees + 1;
    const departmentCode = department.department_name.substring(0, 2).toUpperCase();
    const designationCode = designation.title.substring(0, 2).toUpperCase();
    const paddedNumber = employeeNumber.toString().padStart(2, '0');
    const generatedEmployeeId = `${designationCode}-${departmentCode}-${paddedNumber}`;

    // Check for existing records with more strict validation
    const [existingUser, existingEmployee] = await Promise.all([
      User.findOne({ email: email.trim() }),
      // Check if the generated employeeId already exists (highly unlikely with counter, but good practice)
      Employee.findOne({ employee_id: generatedEmployeeId })
    ]);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already exists"
      });
    }

    // Although we generate unique ID, a rare race condition could occur. Double check.
    if (existingEmployee) {
      return res.status(500).json({
        success: false,
        error: "Generated Employee ID conflict, please try again.",
        details: `Generated ID ${generatedEmployeeId} already exists`
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

    // Create employee with validated data and generated ID
    const newEmployee = new Employee({
      employee_id: generatedEmployeeId, // Use generated ID
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

const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Looking up employee with ID:', id); // Debug log

    // First check if it's a valid MongoDB ID
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Valid MongoDB ID, searching by _id or user_id'); // Debug log
      const employee = await Employee.findOne({
        $or: [
          { _id: id },
          { user_id: id }
        ]
      })
        .populate('department_id', 'department_name')
        .populate('designation_id', 'title basic_salary')
        .populate('user_id', 'name email role profileImage');

      if (employee) {
        console.log('Found employee by MongoDB ID:', employee); // Debug log
        const populatedEmployee = await populateEmployeeData(employee);
        return res.status(200).json({
          success: true,
          data: populatedEmployee
        });
      }
    }

    // If not a MongoDB ID, try searching by employee_id
    console.log('Not a MongoDB ID, searching by employee_id'); // Debug log
    const employee = await Employee.findOne({ employee_id: id })
      .populate('department_id', 'department_name')
      .populate('designation_id', 'title basic_salary')
      .populate('user_id', 'name email role profileImage');

    if (!employee) {
      console.log('No employee found with ID:', id); // Debug log
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    console.log('Found employee by employee_id:', employee); // Debug log
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

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate age if date_of_birth is being updated
    if (updates.date_of_birth) {
      const dob = new Date(updates.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      // Adjust age if birthday hasn't occurred this year
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
        ? age - 1
        : age;

      if (adjustedAge < 21) {
        return res.status(400).json({
          success: false,
          error: "Employee must be at least 21 years old"
        });
      }
    }

    const allowedUpdates = {};
    const updatableFields = ['employee_name', 'marital_status', 'designation_id', 'department_id', 'date_of_birth', 'gender'];

    if (updates.name) allowedUpdates.employee_name = updates.name;
    if (updates.maritalStatus) allowedUpdates.marital_status = updates.maritalStatus;
    if (updates.designation) allowedUpdates.designation_id = updates.designation;
    if (updates.department) allowedUpdates.department_id = updates.department;
    if (updates.date_of_birth) allowedUpdates.date_of_birth = updates.date_of_birth;
    if (updates.gender) allowedUpdates.gender = updates.gender;

    if (allowedUpdates.employee_name) {
      const employee = await Employee.findById(id);
      if (employee) {
        await User.findByIdAndUpdate(employee.user_id, {
          name: allowedUpdates.employee_name
        });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      allowedUpdates,
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

const fetchEmployeesByDepId = async (req, res) => {
  try {
    const { id } = req.params;

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

const getEmployeeCount = async (req, res) => {
  try {
    const count = await Employee.countDocuments();
    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error in getEmployeeCount:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get employee count",
      details: error.message
    });
  }
};

const getLatestEmployeeId = async (req, res) => {
  try {
    const latestEmployee = await Employee.findOne()
      .sort({ employee_id: -1 })
      .select('employee_id');

    let serialNumber = 1;

    if (latestEmployee && latestEmployee.employee_id) {
      const parts = latestEmployee.employee_id.split('-');
      if (parts.length === 3) {
        const lastPart = parts[2];
        const num = parseInt(lastPart);
        if (!isNaN(num)) {
          serialNumber = num + 1;
        }
      }
    }

    return res.status(200).json({
      success: true,
      serialNumber
    });
  } catch (error) {
    console.error("Error in getLatestEmployeeId:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get latest employee ID",
      details: error.message
    });
  }
};

const getEmployeeByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const employee = await Employee.findOne({ user_id: userId })
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
    console.error("Error in getEmployeeByUserId:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch employee",
      details: error.message
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the employee first to get the user_id
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // Delete the employee first
    await Employee.findByIdAndDelete(id);

    // Then delete the associated user
    await User.findByIdAndDelete(employee.user_id);

    return res.status(200).json({
      success: true,
      message: "Employee and associated user deleted successfully"
    });

  } catch (error) {
    console.error("Error in deleteEmployee:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete employee",
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
  fetchEmployeesByDepId,
  getEmployeeCount,
  getLatestEmployeeId,
  getEmployeeByUserId,
  deleteEmployee
};