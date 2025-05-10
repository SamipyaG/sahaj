import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import User from '../models/User.js';
import LeaveSetup from '../models/LeaveSetup.js';

// Utility function to calculate leave days
const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
        throw new Error('End date must be after start date');
    }
    
    const timeDiff = end - start;
    const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    return dayDiff;
};

// Add a new leave request with balance validation
const addLeave = async (req, res) => {
    try {
        const { user_id, leave_setup_id, startDate, endDate, reason } = req.body;

        // Validate required fields
        if (!startDate || !endDate || !leave_setup_id) {
            return res.status(400).json({ 
                success: false, 
                error: "Start date, end date, and leave type are required" 
            });
        }

        // Find employee and leave setup
        const employee = await Employee.findOne({ user_id });
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                error: "Employee not found" 
            });
        }

        const leaveSetup = await LeaveSetup.findById(leave_setup_id);
        if (!leaveSetup) {
            return res.status(404).json({ 
                success: false, 
                error: "Leave type not found" 
            });
        }

        // Calculate requested days
        let numOfDays;
        try {
            numOfDays = calculateLeaveDays(startDate, endDate);
            if (numOfDays <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Invalid date range" 
                });
            }
        } catch (error) {
            return res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }

        // Check leave balance
        const approvedLeaves = await Leave.find({
            employee_id: employee._id,
            leave_setup_id,
            status: "Approved"
        });

        const consumedDays = approvedLeaves.reduce((sum, leave) => sum + leave.numOfDays, 0);
        const remainingDays = leaveSetup.maxDays - consumedDays;

        if (numOfDays > remainingDays) {
            return res.status(400).json({ 
                success: false, 
                error: `Insufficient leave balance. You have ${remainingDays} days remaining for ${leaveSetup.leaveType}`,
                remainingDays,
                maxDays: leaveSetup.maxDays
            });
        }

        // Create new leave
        const newLeave = new Leave({
            leave_id: "LEAVE-" + Date.now(),
            employee_id: employee._id,
            leave_setup_id,
            leaveType: leaveSetup.leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            numOfDays,
            status: "Pending"
        });

        await newLeave.save();

        return res.status(201).json({ 
            success: true, 
            message: "Leave request submitted successfully", 
            leave: newLeave,
            remainingDays: remainingDays - numOfDays
        });

    } catch (error) {
        console.error("Leave creation error:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while processing leave request" 
        });
    }
};

// Get leave history for balance calculation
const getLeaveHistory = async (req, res) => {
    try {
        const { userId, leaveSetupId } = req.params;

        const employee = await Employee.findOne({ user_id: userId });
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                error: "Employee not found" 
            });
        }

        const leaveSetup = await LeaveSetup.findById(leaveSetupId);
        if (!leaveSetup) {
            return res.status(404).json({ 
                success: false, 
                error: "Leave type not found" 
            });
        }

        const leaves = await Leave.find({
            employee_id: employee._id,
            leave_setup_id: leaveSetupId,
            status: "Approved"
        }).sort({ startDate: -1 });

        const consumedDays = leaves.reduce((sum, leave) => sum + leave.numOfDays, 0);
        const remainingDays = leaveSetup.maxDays - consumedDays;

        return res.status(200).json({ 
            success: true, 
            leaves,
            consumedDays,
            remainingDays,
            maxDays: leaveSetup.maxDays,
            leaveType: leaveSetup.leaveType
        });

    } catch (error) {
        console.error("Leave history error:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching leave history" 
        });
    }
};

// Get leaves based on user ID and role
const getLeave = async (req, res) => {
    try {
        const { id, role } = req.params;
        const { startDate, endDate, status } = req.query;

        let query = {};
        if (startDate && endDate) {
            query.startDate = { $gte: new Date(startDate) };
            query.endDate = { $lte: new Date(endDate) };
        }
        if (status) {
            query.status = status;
        }

        const populationOptions = [
            { 
                path: 'employee_id', 
                populate: [
                    { path: 'department_id', select: 'department_name' },
                    { path: 'user_id', select: 'name email' }
                ] 
            },
            { 
                path: 'leave_setup_id',
                select: 'leaveType maxDays description' 
            }
        ];

        if (role === "admin") {
            const leaves = await Leave.find(query)
                .populate(populationOptions)
                .sort({ createdAt: -1 });
            return res.status(200).json({ success: true, leaves });
        }

        const employee = await Employee.findOne({ user_id: id });
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                error: "Employee not found" 
            });
        }

        query.employee_id = employee._id;
        const leaves = await Leave.find(query)
            .populate(populationOptions)
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, leaves });

    } catch (error) {
        console.error("Leave fetch error:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching leave data" 
        });
    }
};

// Get all leaves (admin only)
const getLeaves = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.startDate = { $gte: new Date(startDate) };
            query.endDate = { $lte: new Date(endDate) };
        }
        if (status) {
            query.status = status;
        }

        const leaves = await Leave.find(query)
            .populate([
                {
                    path: 'employee_id',
                    populate: [
                        { path: 'department_id', select: 'department_name' },
                        { path: 'user_id', select: 'name email' }
                    ]
                },
                {
                    path: 'leave_setup_id',
                    select: 'leaveType maxDays'
                }
            ])
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, leaves });

    } catch (error) {
        console.error("All leaves fetch error:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching all leaves" 
        });
    }
};

// Get leave details
const getLeaveDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const leave = await Leave.findById(id)
            .populate({
                path: 'employee_id',
                populate: [
                    { path: 'department_id', select: 'department_name' },
                    { path: 'user_id', select: 'name email profileImage' }
                ]
            })
            .populate('leave_setup_id', 'leaveType maxDays description');

        if (!leave) {
            return res.status(404).json({ 
                success: false, 
                error: "Leave request not found" 
            });
        }

        return res.status(200).json({ 
            success: true, 
            leave: {
                ...leave._doc,
                startDate: leave.startDate.toISOString().split('T')[0],
                endDate: leave.endDate.toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error("Leave detail error:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching leave details" 
        });
    }
};

// Update leave status
const updateLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, startDate, endDate, reason } = req.body;

        const existingLeave = await Leave.findById(id);
        if (!existingLeave) {
            return res.status(404).json({ 
                success: false, 
                error: "Leave request not found" 
            });
        }

        const updateData = {};
        if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
            updateData.status = status;
        }

        if (startDate || endDate) {
            const newStartDate = startDate ? new Date(startDate) : existingLeave.startDate;
            const newEndDate = endDate ? new Date(endDate) : existingLeave.endDate;

            try {
                const numOfDays = calculateLeaveDays(newStartDate, newEndDate);
                updateData.startDate = newStartDate;
                updateData.endDate = newEndDate;
                updateData.numOfDays = numOfDays;
            } catch (error) {
                return res.status(400).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        }

        if (reason) {
            updateData.reason = reason;
        }

        const updatedLeave = await Leave.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate({
            path: 'employee_id',
            populate: { path: 'user_id', select: 'name email' }
        });

        return res.status(200).json({ 
            success: true, 
            message: "Leave updated successfully", 
            leave: updatedLeave 
        });

    } catch (error) {
        console.error("Leave update error:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while updating leave" 
        });
    }
};

export { 
    addLeave, 
    getLeave, 
    getLeaves, 
    getLeaveDetail, 
    updateLeave,
    getLeaveHistory 
};