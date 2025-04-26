import Designation from '../models/Designation.js';

// Create a new designation
const addDesignation = async (req, res) => {
    try {
        const { title, basic_salary, description } = req.body;

        // Validate required fields
        if (!title || !basic_salary) {
            return res.status(400).json({ 
                success: false, 
                error: "Title and basic salary are required" 
            });
        }

        // Generate a unique designation_id
        const designation_id = 'DESG-' + Date.now().toString().slice(-6);

        // Create new designation
        const newDesignation = new Designation({
            designation_id,
            title,
            basic_salary,
            description: description || '' // Default to empty string if not provided
        });

        await newDesignation.save();
        return res.status(201).json({ success: true, designation: newDesignation });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Error creating designation: " + error.message });
    }
};

// Get all designations
const getDesignations = async (req, res) => {
    try {
        const designations = await Designation.find();
        return res.status(200).json({ success: true, designations });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error fetching designations: " + error.message });
    }
};


// Get a specific designation by ID
const getDesignationById = async (req, res) => {
    try {
        const { id } = req.params;
        const designation = await Designation.findById(id);
        
        if (!designation) {
            return res.status(404).json({ success: false, error: "Designation not found" });
        }

        return res.status(200).json({ success: true, designation });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error fetching designation: " + error.message });
    }
};

// Update a designation
const updateDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const { designation_name, basic_salary, allowances, deductions } = req.body;

        // Validate required fields
        if (!designation_name || !basic_salary) {
            return res.status(400).json({ success: false, error: "Designation name and basic salary are required" });
        }

        const updatedDesignation = await Designation.findByIdAndUpdate(
            id,
            { designation_name, basic_salary, allowances, deductions },
            { new: true, runValidators: true } // Return updated document and run schema validators
        );

        if (!updatedDesignation) {
            return res.status(404).json({ success: false, error: "Designation not found" });
        }

        return res.status(200).json({ success: true, designation: updatedDesignation });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error updating designation: " + error.message });
    }
};

// Delete a designation
const deleteDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDesignation = await Designation.findByIdAndDelete(id);
        
        if (!deletedDesignation) {
            return res.status(404).json({ success: false, error: "Designation not found" });
        }

        return res.status(200).json({ success: true, message: "Designation deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error deleting designation: " + error.message });
    }
};

export { addDesignation, getDesignations, getDesignationById, updateDesignation, deleteDesignation };