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

    console.log('[updateHandoverStatus] Request params:', { id, status, user_id }); // Debug log

    // Find the employee making the request
    const employee = await Employee.findOne({ user_id });
    if (!employee) {
      console.log('[updateHandoverStatus] No employee found for user_id:', user_id); // Debug log
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    console.log('[updateHandoverStatus] Found employee:', employee._id); // Debug log

    // Find the handover
    const handover = await LeaveHandover.findById(id);
    if (!handover) {
      console.log('[updateHandoverStatus] No handover found for id:', id); // Debug log
      return res.status(404).json({
        success: false,
        error: "Handover request not found"
      });
    }

    console.log('[updateHandoverStatus] Found handover:', {
      id: handover._id,
      to_employee_id: handover.to_employee_id,
      current_employee_id: employee._id
    }); // Debug log

    // Verify the employee is the recipient
    if (handover.to_employee_id.toString() !== employee._id.toString()) {
      console.log('[updateHandoverStatus] Unauthorized: Employee is not the recipient'); // Debug log
      return res.status(403).json({
        success: false,
        error: "Unauthorized to update this handover"
      });
    }

    // Check if handover is admin-initiated
    if (handover.is_admin_initiated) {
      console.log('[updateHandoverStatus] Cannot modify admin-initiated handover'); // Debug log
      return res.status(400).json({
        success: false,
        error: "Cannot modify admin-initiated handover"
      });
    }

    // Update the status
    handover.status = status;
    handover.updated_at = new Date();
    await handover.save();

    console.log('[updateHandoverStatus] Successfully updated handover status'); // Debug log

    return res.status(200).json({
      success: true,
      message: "Handover status updated successfully",
      handover
    });

  } catch (error) {
    console.error('[updateHandoverStatus] Error:', error); // Debug log
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
    console.log('[getHandoverHistory] user_id from token:', user_id); // Debug log

    const employee = await Employee.findOne({ user_id });
    if (!employee) {
      console.log('[getHandoverHistory] No employee found for user_id:', user_id); // Debug log
      return res.status(404).json({
        success: false,
        error: `Employee not found for user_id: ${user_id}`
      });
    }

    const handovers = await LeaveHandover.find({
      $or: [
        { from_employee_id: employee._id },
        { to_employee_id: employee._id }
      ]
    })
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

    console.log(`[getHandoverHistory] Found ${handovers.length} handovers for employee_id:`, employee._id); // Debug log

    return res.status(200).json({
      success: true,
      handovers
    });

  } catch (error) {
    console.error('[getHandoverHistory] Handover history fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching handover history',
      details: error.message
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
