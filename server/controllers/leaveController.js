import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import User from '../models/User.js';

// Function to calculate the number of leave days (improved)
const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate dates
    if (start > end) {
        throw new Error('End date must be after start date');
    }
    
    // Calculate difference in days (inclusive of both start and end dates)
    const timeDiff = end - start;
    const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    
    return dayDiff;
};

// Add a new leave request (updated with date validation)
const addLeave = async (req, res) => {
    try {
        const { user_id, leaveType, startDate, endDate, reason } = req.body;

        // Validate required fields
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: "Start date and end date are required" });
        }

        // Find the employee associated with the user
        const employee = await Employee.findOne({ user_id });
        if (!employee) {
            return res.status(404).json({ success: false, error: "Employee not found" });
        }

        // Calculate the number of leave days with validation
        let numOfDays;
        try {
            numOfDays = calculateLeaveDays(startDate, endDate);
            if (numOfDays <= 0) {
                return res.status(400).json({ success: false, error: "Invalid date range" });
            }
        } catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        // Create a new leave request
        const newLeave = new Leave({
            leave_id: "LEAVE-" + Date.now(),
            employee_id: employee._id,
            leave_setup_id: req.body.leave_setup_id,
            leaveType, // Added leaveType to the document
            startDate: new Date(startDate), // Ensure proper date format
            endDate: new Date(endDate), // Ensure proper date format
            reason,
            numOfDays,
            status: "Pending"
        });

        await newLeave.save();

        return res.status(201).json({ 
            success: true, 
            message: "Leave request submitted successfully", 
            leave: newLeave 
        });

    } catch (error) {
        console.error("Leave creation error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while processing leave request" 
        });
    }
};

// Get leave requests (updated with date filtering)
const getLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        // Find the user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        let leaves;
        let query = {};

        // Date filtering (if provided)
        if (startDate && endDate) {
            query.startDate = { $gte: new Date(startDate) };
            query.endDate = { $lte: new Date(endDate) };
        }

        // Common population options
        const populationOptions = [
            { 
                path: 'employee_id', 
                populate: [
                    { path: 'department_id', select: 'department_name' },
                    { path: 'user_id', select: 'name' }
                ] 
            },
            { 
                path: 'leave_setup_id',  // Populate leave type details
                select: 'leaveType maxDays description' 
            }
        ];

        if (user.role === "admin") {
            // Admin: Fetch all leaves with filtering
            leaves = await Leave.find(query)
                .populate(populationOptions)
                .sort({ startDate: -1 });
        } else {
            // Non-admin: Fetch only their leaves
            const employee = await Employee.findOne({ user_id: id });
            if (!employee) {
                return res.status(404).json({ success: false, error: "Employee not found" });
            }
            query.employee_id = employee._id;
            leaves = await Leave.find(query)
                .populate(populationOptions)
                .sort({ startDate: -1 });
        }

        return res.status(200).json({ success: true, leaves });

    } catch (error) {
        console.error("Leave fetch error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching leave data" 
        });
    }
};
// Get all leave requests (updated with date filtering for admin)
const getLeaves = async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Added date filtering
        let query = {};

        // Add date filtering if provided
        if (startDate && endDate) {
            query.startDate = { $gte: new Date(startDate) };
            query.endDate = { $lte: new Date(endDate) };
        }

        const leaves = await Leave.find(query).populate([
            {
                path: 'employee_id',
                populate: [
                    { path: 'department_id', select: 'department_name' },
                    { path: 'user_id', select: 'name' }
                ]
            },
            {
                path: 'leave_setup_id',
                select: 'leaveType'
            }
        ]).sort({ startDate: -1 }); // Sort by most recent first

        return res.status(200).json({ success: true, leaves });

    } catch (error) {
        console.error("All leaves fetch error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching all leaves" 
        });
    }
};

// Get details of a specific leave request (updated)
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

        // Format dates for better readability if needed
        const formattedLeave = {
            ...leave._doc,
            startDate: leave.startDate.toISOString().split('T')[0],
            endDate: leave.endDate.toISOString().split('T')[0]
        };

        return res.status(200).json({ success: true, leave: formattedLeave });

    } catch (error) {
        console.error("Leave detail error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching leave details" 
        });
    }
};

// Update leave status (including date changes if needed)
const updateLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, startDate, endDate, reason } = req.body;

        // Find the existing leave
        const existingLeave = await Leave.findById(id);
        if (!existingLeave) {
            return res.status(404).json({ success: false, error: "Leave request not found" });
        }

        // Prepare update object
        const updateData = {};

        // Only allow status updates if provided
        if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
            updateData.status = status;
        }

        // Handle date updates if provided
        if (startDate || endDate) {
            const newStartDate = startDate ? new Date(startDate) : existingLeave.startDate;
            const newEndDate = endDate ? new Date(endDate) : existingLeave.endDate;

            // Validate new dates
            try {
                const numOfDays = calculateLeaveDays(newStartDate, newEndDate);
                updateData.startDate = newStartDate;
                updateData.endDate = newEndDate;
                updateData.numOfDays = numOfDays;
            } catch (error) {
                return res.status(400).json({ success: false, error: error.message });
            }
        }

        // Update reason if provided
        if (reason) {
            updateData.reason = reason;
        }

        // Update the leave
        const updatedLeave = await Leave.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate({
            path: 'employee_id',
            populate: { path: 'user_id', select: 'name' }
        });

        return res.status(200).json({ 
            success: true, 
            message: "Leave updated successfully", 
            leave: updatedLeave 
        });

    } catch (error) {
        console.error("Leave update error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while updating leave" 
        });
    }
};

export { addLeave, getLeave, getLeaves, getLeaveDetail, updateLeave };