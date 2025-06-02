import LeaveHandover from '../models/LeaveHandover.js';
import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';

// Create a new leave handover
const createLeaveHandover = async (req, res) => {
  try {
    const { leave_id, to_employee_id, handover_notes } = req.body;
    const user_id = req.user._id;

    // Find the employee making the request
    const fromEmployee = await Employee.findOne({ user_id });
    if (!fromEmployee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // Find the target employee
    const toEmployee = await Employee.findById(to_employee_id);
    if (!toEmployee) {
      return res.status(404).json({
        success: false,
        error: "Target employee not found"
      });
    }

    // Prevent handover to self
    if (fromEmployee._id.toString() === toEmployee._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "Cannot create handover to yourself"
      });
    }

    // Verify the leave exists and belongs to the employee
    const leave = await Leave.findOne({
      _id: leave_id,
      employee_id: fromEmployee._id
    }).populate('leave_setup_id', 'leaveType maxDays');

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave request not found or unauthorized"
      });
    }

    // Check if leave is approved
    if (leave.status !== "Approved") {
      return res.status(400).json({
        success: false,
        error: "Can only create handover for approved leaves"
      });
    }

    // Debug logging for date comparison
    const currentDate = new Date();
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    // Set time to start of day for all dates
    currentDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    console.log('Current Date:', currentDate);
    console.log('Leave Start Date:', startDate);
    console.log('Leave End Date:', endDate);
    console.log('Is current date before start?', currentDate < startDate);
    console.log('Is current date after end?', currentDate > endDate);

    // Check if leave is active
    if (currentDate < startDate || currentDate > endDate) {
      return res.status(400).json({
        success: false,
        error: "Can only create handover during active leave period"
      });
    }

    // Create the handover
    const newHandover = new LeaveHandover({
      leave_id,
      from_employee_id: fromEmployee._id,
      to_employee_id,
      handover_notes,
      is_admin_initiated: false,
      status: 'Pending'
    });

    await newHandover.save();

    // Populate the handover data before sending response
    const populatedHandover = await LeaveHandover.findById(newHandover._id)
      .populate({
        path: 'leave_id',
        select: 'startDate endDate leaveType status',
        populate: {
          path: 'leave_setup_id',
          select: 'leaveType maxDays'
        }
      })
      .populate({
        path: 'from_employee_id',
        select: 'employee_name',
        populate: {
          path: 'user_id',
          select: 'name email'
        }
      })
      .populate({
        path: 'to_employee_id',
        select: 'employee_name',
        populate: {
          path: 'user_id',
          select: 'name email'
        }
      });

    return res.status(201).json({
      success: true,
      message: "Leave handover request created successfully",
      handover: populatedHandover
    });

  } catch (error) {
    console.error("Leave handover creation error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while creating leave handover"
    });
  }
};

// Admin creates a leave handover
const createAdminLeaveHandover = async (req, res) => {
  try {
    const { leave_id, from_employee_id, to_employee_id, handover_notes } = req.body;

    // Prevent handover to self
    if (from_employee_id === to_employee_id) {
      return res.status(400).json({
        success: false,
        error: "Cannot create handover to the same employee"
      });
    }

    // Verify the leave exists
    const leave = await Leave.findById(leave_id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave request not found"
      });
    }

    // Verify both employees exist
    const [fromEmployee, toEmployee] = await Promise.all([
      Employee.findById(from_employee_id),
      Employee.findById(to_employee_id)
    ]);

    if (!fromEmployee || !toEmployee) {
      return res.status(404).json({
        success: false,
        error: "One or both employees not found"
      });
    }

    // Create the admin-initiated handover
    const newHandover = new LeaveHandover({
      leave_id,
      from_employee_id,
      to_employee_id,
      handover_notes,
      is_admin_initiated: true,
      status: 'Accepted' // Admin handovers are automatically accepted
    });

    await newHandover.save();

    return res.status(201).json({
      success: true,
      message: "Leave handover created successfully by admin",
      handover: newHandover
    });

  } catch (error) {
    console.error("Admin leave handover creation error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while creating leave handover"
    });
  }
};

// Update handover status (accept/reject)
const updateHandoverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user._id;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be either 'Accepted' or 'Rejected'"
      });
    }

    const employee = await Employee.findOne({ user_id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    const handover = await LeaveHandover.findById(id);
    if (!handover) {
      return res.status(404).json({
        success: false,
        error: "Handover request not found"
      });
    }

    if (handover.to_employee_id.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this handover"
      });
    }

    if (handover.is_admin_initiated) {
      return res.status(403).json({
        success: false,
        error: "Cannot update admin-initiated handover"
      });
    }

    handover.status = status;
    await handover.save();

    // Populate the updated handover data
    const updatedHandover = await LeaveHandover.findById(handover._id)
      .populate({
        path: 'leave_id',
        select: 'startDate endDate leaveType status',
        populate: {
          path: 'leave_setup_id',
          select: 'leaveType maxDays'
        }
      })
      .populate({
        path: 'from_employee_id',
        select: 'employee_name',
        populate: {
          path: 'user_id',
          select: 'name email'
        }
      })
      .populate({
        path: 'to_employee_id',
        select: 'employee_name',
        populate: {
          path: 'user_id',
          select: 'name email'
        }
      });

    return res.status(200).json({
      success: true,
      message: `Handover ${status.toLowerCase()} successfully`,
      handover: updatedHandover
    });

  } catch (error) {
    console.error("Handover status update error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while updating handover status"
    });
  }
};

// Get handover history for an employee
const getHandoverHistory = async (req, res) => {
  try {
    const user_id = req.user._id;
    const employee = await Employee.findOne({ user_id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    const handovers = await LeaveHandover.find({
      $or: [
        { from_employee_id: employee._id },
        { to_employee_id: employee._id }
      ]
    })
      .populate({
        path: 'leave_id',
        select: 'startDate endDate leaveType status',
        populate: {
          path: 'leave_setup_id',
          select: 'leaveType maxDays'
        }
      })
      .populate({
        path: 'from_employee_id',
        select: 'employee_name',
        populate: {
          path: 'user_id',
          select: 'name email'
        }
      })
      .populate({
        path: 'to_employee_id',
        select: 'employee_name',
        populate: {
          path: 'user_id',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      handovers
    });

  } catch (error) {
    console.error("Handover history error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while fetching handover history"
    });
  }
};

// Get all handovers (admin only)
const getAllHandovers = async (req, res) => {
  try {
    const handovers = await LeaveHandover.find()
      .populate('leave_id', 'startDate endDate leaveType')
      .populate({
        path: 'from_employee_id',
        populate: {
          path: 'user_id',
          select: 'name email'
        }
      })
      .populate({
        path: 'to_employee_id',
        populate: {
          path: 'user_id',
          select: 'name email'
        }
      })
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      handovers
    });

  } catch (error) {
    console.error("All handovers fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while fetching all handovers"
    });
  }
};

export {
  createLeaveHandover,
  createAdminLeaveHandover,
  updateHandoverStatus,
  getHandoverHistory,
  getAllHandovers
};
