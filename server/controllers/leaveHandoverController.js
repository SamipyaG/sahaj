import LeaveHandover from '../models/LeaveHandover.js';
import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';

// Create a new leave handover
const createLeaveHandover = async (req, res) => {
  try {
    const { leave_id, to_employee_id, handover_notes } = req.body;
    const { user_id } = req.user;

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

    // Verify the leave exists and belongs to the employee
    const leave = await Leave.findOne({
      _id: leave_id,
      employee_id: fromEmployee._id
    });

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

    // Check if leave is active
    const currentDate = new Date();
    if (currentDate < leave.startDate || currentDate > leave.endDate) {
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
      is_admin_initiated: false
    });

    await newHandover.save();

    return res.status(201).json({
      success: true,
      message: "Leave handover request created successfully",
      handover: newHandover
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
    const { user_id } = req.user;

    // Find the employee making the request
    const employee = await Employee.findOne({ user_id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // Find the handover
    const handover = await LeaveHandover.findById(id);
    if (!handover) {
      return res.status(404).json({
        success: false,
        error: "Handover request not found"
      });
    }

    // Verify the employee is the recipient
    if (handover.to_employee_id.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized to update this handover"
      });
    }

    // Check if handover is admin-initiated
    if (handover.is_admin_initiated) {
      return res.status(400).json({
        success: false,
        error: "Cannot modify admin-initiated handover"
      });
    }

    // Update the status
    handover.status = status;
    handover.updated_at = new Date();
    await handover.save();

    return res.status(200).json({
      success: true,
      message: "Handover status updated successfully",
      handover
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
    const { user_id } = req.user;

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
      .populate('leave_id', 'startDate endDate leaveType')
      .populate('from_employee_id', 'user_id')
      .populate('to_employee_id', 'user_id')
      .populate({
        path: 'from_employee_id.user_id',
        select: 'name email'
      })
      .populate({
        path: 'to_employee_id.user_id',
        select: 'name email'
      })
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      handovers
    });

  } catch (error) {
    console.error("Handover history fetch error:", error);
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
      .populate('from_employee_id', 'user_id')
      .populate('to_employee_id', 'user_id')
      .populate({
        path: 'from_employee_id.user_id',
        select: 'name email'
      })
      .populate({
        path: 'to_employee_id.user_id',
        select: 'name email'
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
