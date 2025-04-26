import Department from "../models/Department.js";

// Get all departments
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        return res.status(200).json({ success: true, departments });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error fetching departments: " + error.message });
    }
};

// Add a new department
const addDepartment = async (req, res) => {
    try {
        const { department_id, department_name, department_description, paid_leave } = req.body;

        // Validate required fields
        if (!department_id || !department_name || !department_description) {
            return res.status(400).json({ 
                success: false, 
                error: "Department ID, name, and description are required" 
            });
        }

        // Check if department_id already exists
        const existingDepartment = await Department.findOne({ department_id });
        if (existingDepartment) {
            return res.status(400).json({ success: false, error: "Department ID already exists" });
        }

        // Create new department
        const newDep = new Department({ 
            department_id, 
            department_name,
            department_description,
            paid_leave: paid_leave || 16 // Default to 16 if not provided
        });

        await newDep.save();
        return res.status(201).json({ success: true, department: newDep });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Error adding department: " + error.message });
    }
};

// Get a single department by ID
const getDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id);

        if (!department) {
            return res.status(404).json({ success: false, error: "Department not found" });
        }

        return res.status(200).json({ success: true, department });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error fetching department: " + error.message });
    }
};

// Update a department
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { department_name, department_description, paid_leave } = req.body;

        // Validate required fields
        if (!department_name || !department_description) {
            return res.status(400).json({ success: false, error: "Department name and description are required" });
        }

        const updatedDep = await Department.findByIdAndUpdate(
            id,
            { department_name, department_description, paid_leave },
            { new: true, runValidators: true } // Return updated document and run schema validators
        );

        if (!updatedDep) {
            return res.status(404).json({ success: false, error: "Department not found" });
        }

        return res.status(200).json({ success: true, department: updatedDep });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error updating department: " + error.message });
    }
};

// Delete a department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDep = await Department.findByIdAndDelete(id);

        if (!deletedDep) {
            return res.status(404).json({ success: false, error: "Department not found" });
        }

        return res.status(200).json({ success: true, message: "Department deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error deleting department: " + error.message });
    }
};

export { addDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment };