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

// Get leave statistics
const getLeaveStats = async (req, res) => {
    try {
        console.log('Fetching leave statistics...');
        const { year, departmentId, leaveTypeId } = req.query;
        console.log('Received filters:', { year, departmentId, leaveTypeId });

        let matchStage = { status: "Approved" };

        // Add year filter
        if (year) {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
            matchStage.startDate = { $gte: startOfYear, $lte: endOfYear };
        }

        // Add department filter
        if (departmentId && departmentId !== 'all') {
            // Need to populate employee to filter by department
            // This will require adjusting the aggregation pipeline significantly,
            // or fetching employees first then filtering leave based on employee IDs
            // For simplicity, let's assume departmentId filtering will be done by first fetching employees
            // with that departmentId and then matching their leave records.

            const employeesInDepartment = await Employee.find({ department_id: departmentId }).select('_id');
            const employeeIds = employeesInDepartment.map(emp => emp._id);
            matchStage.employee_id = { $in: employeeIds };
        }

        // Add leave type filter
        if (leaveTypeId && leaveTypeId !== 'all') {
            matchStage.leave_setup_id = leaveTypeId;
        }

        console.log('Final match stage:', matchStage);

        // Get approved leaves with populated leave setup, applying filters
        const leaves = await Leave.find(matchStage)
            .populate('leave_setup_id', 'leaveType')
            .lean();

        console.log('Found filtered leaves:', leaves);

        // Group leaves by leave type
        const stats = leaves.reduce((acc, leave) => {
            const leaveType = leave.leave_setup_id?.leaveType || 'Unknown';
            if (!acc[leaveType]) {
                acc[leaveType] = 0;
            }
            acc[leaveType]++;
            return acc;
        }, {});

        // Convert to array format
        const statsArray = Object.entries(stats).map(([leaveType, count]) => ({
            leaveType,
            count
        }));

        console.log('Processed stats:', statsArray);

        return res.status(200).json({
            success: true,
            stats: statsArray
        });

    } catch (error) {
        console.error("Leave stats error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while fetching leave statistics"
        });
    }
};

// Get employee-specific leave statistics
const getEmployeeLeaveStats = async (req, res) => {
    try {
        const { userId } = req.params;

        // First find the employee record using the user ID
        const employee = await Employee.findOne({ user_id: userId });
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: "Employee not found for this user"
            });
        }

        // Get leave statistics for this employee
        const stats = await Leave.aggregate([
            {
                $match: {
                    employee_id: employee._id,
                    status: "Approved"  // Only count approved leaves
                }
            },
            {
                $lookup: {
                    from: 'leavesetups',
                    localField: 'leave_setup_id',
                    foreignField: '_id',
                    as: 'leaveSetup'
                }
            },
            {
                $unwind: '$leaveSetup'
            },
            {
                $group: {
                    _id: '$leaveSetup.leaveType',
                    count: { $sum: 1 },
                    leaveType: { $first: '$leaveSetup.leaveType' }
                }
            },
            {
                $project: {
                    _id: 0,
                    leaveType: 1,
                    count: 1
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        console.error("Employee leave stats error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while fetching employee leave statistics"
        });
    }
};

// Get overall employee leave statistics
const getOverallEmployeeLeaveStats = async (req, res) => {
    try {
        const stats = await Leave.aggregate([
            {
                $match: {
                    status: "Approved"
                }
            },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'employee_id',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            {
                $unwind: {
                    path: '$employee',
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'employee.user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $lookup: {
                    from: 'leavesetups',
                    localField: 'leave_setup_id',
                    foreignField: '_id',
                    as: 'leaveSetup'
                }
            },
            {
                $unwind: {
                    path: '$leaveSetup',
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $group: {
                    _id: '$user.name',
                    totalLeaves: { $sum: 1 },
                    leaveTypes: {
                        $push: {
                            leaveType: '$leaveSetup.leaveType',
                            days: '$numOfDays'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    employeeName: '$_id',
                    totalLeaves: 1,
                    leaveTypes: 1
                }
            },
            {
                $sort: { totalLeaves: -1 }
            }
        ]);

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        console.error("Overall employee leave stats error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error while fetching overall employee leave statistics"
        });
    }
};

export {
    addLeave,
    getLeave,
    getLeaves,
    getLeaveDetail,
    updateLeave,
    getLeaveHistory,
    getLeaveStats,
    getEmployeeLeaveStats,
    getOverallEmployeeLeaveStats
};