import LeaveSetup from "../models/LeaveSetup.js";

// Get all leave setups
const getLeaveSetups = async (req, res) => {
    try {
        const leaveSetups = await LeaveSetup.find();
        return res.status(200).json({ success: true, leaveSetups });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error fetching leave setups: " + error.message });
    }
};

// Add a new leave setup
const addLeaveSetup = async (req, res) => {
    try {
        const { leaveType, maxDays, description } = req.body;
        console.log(leaveType,maxDays,description)

        // Validate required fields
        if (!leaveType || !maxDays) {
            return res.status(400).json({ 
                success: false, 
                error: "Leave type and max days are required" 
            });
        }

        // Check if leaveType already exists
        const existingLeaveSetup = await LeaveSetup.findOne({ leaveType });
        if (existingLeaveSetup) {
            return res.status(400).json({ success: false, error: "Leave type already exists" });
        }

        // Create new leave setup
        const newLeaveSetup = new LeaveSetup({ 
            leaveType,
            maxDays,
            description: description || "" // Default to empty string if not provided
        });

        await newLeaveSetup.save();
        return res.status(201).json({ success: true, leaveSetup: newLeaveSetup });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Error adding leave setup: " + error.message });
    }
};

// Get a single leave setup by ID
const getLeaveSetup = async (req, res) => {
    try {
        const { id } = req.params;
        const leaveSetup = await LeaveSetup.findById(id);

        if (!leaveSetup) {
            return res.status(404).json({ success: false, error: "Leave setup not found" });
        }

        return res.status(200).json({ success: true, leaveSetup });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error fetching leave setup: " + error.message });
    }
};

// Update a leave setup
const updateLeaveSetup = async (req, res) => {
    try {
        const { id } = req.params;
        const { leaveType, maxDays, description } = req.body;

        // Validate required fields
        if (!leaveType || !maxDays) {
            return res.status(400).json({ success: false, error: "Leave type and max days are required" });
        }

        const updatedLeaveSetup = await LeaveSetup.findByIdAndUpdate(
            id,
            { leaveType, maxDays, description },
            { new: true, runValidators: true } // Return updated document and run schema validators
        );

        if (!updatedLeaveSetup) {
            return res.status(404).json({ success: false, error: "Leave setup not found" });
        }

        return res.status(200).json({ success: true, leaveSetup: updatedLeaveSetup });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error updating leave setup: " + error.message });
    }
};

// Delete a leave setup
const deleteLeaveSetup = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLeaveSetup = await LeaveSetup.findByIdAndDelete(id);

        if (!deletedLeaveSetup) {
            return res.status(404).json({ success: false, error: "Leave setup not found" });
        }

        return res.status(200).json({ success: true, message: "Leave setup deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error deleting leave setup: " + error.message });
    }
};

export { 
    addLeaveSetup, 
    getLeaveSetups, 
    getLeaveSetup, 
    updateLeaveSetup, 
    deleteLeaveSetup 
};