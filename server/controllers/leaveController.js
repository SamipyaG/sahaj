import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import User from '../models/User.js';

// Function to calculate the number of leave days
const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

// Add a new leave request
const addLeave = async (req, res) => {
    try {
        const { user_id, startDate, endDate, reason } = req.body;

        // Find the employee associated with the user
        const employee = await Employee.findOne({ user_id });

        if (!employee) {
            return res.status(404).json({ success: false, error: "Employee not found" });
        }

        // Calculate the number of leave days
        const numOfDays = calculateLeaveDays(startDate, endDate);

        // Create a new leave request
        const newLeave = new Leave({
            employee_id: employee._id,
            leave_setup_id: req.body.leave_setup_id, // Assuming this is passed in the request
            startDate,
            endDate,
            reason,
            numOfDays,
            status: "Pending" // Default status as per schema
        });

        await newLeave.save();

        return res.status(200).json({ success: true, message: "Leave request submitted", leave: newLeave });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: "Server error while adding leave" });
    }
};

// Get leave requests for a specific user or all leaves for admin
const getLeave = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        let leaves;
        if (user.role === "admin") {
            // Admin can see all leave requests
            leaves = await Leave.find().populate({
                path: 'employee_id',
                populate: [
                    { path: 'department_id', select: 'department_name' },
                    { path: 'user_id', select: 'name' }
                ]
            });
        } else {
            // Non-admin users can only see their own leave requests
            const employee = await Employee.findOne({ user_id: id });
            if (!employee) {
                return res.status(404).json({ success: false, error: "Employee not found" });
            }
            leaves = await Leave.find({ employee_id: employee._id }).populate({
                path: 'employee_id',
                populate: [
                    { path: 'department_id', select: 'department_name' },
                    { path: 'user_id', select: 'name' }
                ]
            });
        }

        return res.status(200).json({ success: true, leaves });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: "Server error while fetching leave data" });
    }
};

// Get all leave requests (for admin)
const getLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find().populate({
            path: 'employee_id',
            populate: [
                { path: 'department_id', select: 'department_name' },
                { path: 'user_id', select: 'name' }
            ]
        });

        return res.status(200).json({ success: true, leaves });
    } catch (error) {
        console.log("Error:", error.message);
        return res.status(500).json({ success: false, error: "Server error while fetching all leaves" });
    }
};

// Get details of a specific leave request
const getLeaveDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const leave = await Leave.findById(id).populate({
            path: 'employee_id',
            populate: [
                { path: 'department_id', select: 'department_name' },
                { path: 'user_id', select: 'name profileImage' }
            ]
        });

        if (!leave) {
            return res.status(404).json({ success: false, error: "Leave request not found" });
        }

        return res.status(200).json({ success: true, leave });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: "Server error while fetching leave details" });
    }
};

// Update leave status (e.g., Approve or Reject)
const updateLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!["Pending", "Approved", "Rejected"].includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status value" });
        }

        // Update the leave status
        const updatedLeave = await Leave.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedLeave) {
            return res.status(404).json({ success: false, error: "Leave request not found" });
        }

        return res.status(200).json({ success: true, message: "Leave status updated", leave: updatedLeave });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: "Server error while updating leave status" });
    }
};

export { addLeave, getLeave, getLeaves, getLeaveDetail, updateLeave };