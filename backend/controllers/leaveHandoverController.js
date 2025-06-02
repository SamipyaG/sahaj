const LeaveHandover = require('../models/LeaveHandover');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { validateObjectId } = require('../utils/validation');

// Helper function to check if an employee is on leave during a specific period
const isEmployeeOnLeave = async (employeeId, startDate, endDate) => {
  const leaves = await Leave.find({
    employee_id: employeeId,
    status: 'Approved',
    $or: [
      {
        start_date: { $lte: endDate },
        end_date: { $gte: startDate }
      }
    ]
  });
  return leaves.length > 0;
};

// Helper function to check if an employee has overlapping handovers
const hasOverlappingHandovers = async (employeeId, startDate, endDate) => {
  const handovers = await LeaveHandover.find({
    to_employee_id: employeeId,
    status: { $in: ['Pending', 'Accepted'] }
  }).populate('leave_id');

  return handovers.some(handover => {
    const leave = handover.leave_id;
    return (
      (leave.start_date <= endDate && leave.end_date >= startDate)
    );
  });
};

exports.createHandover = async (req, res) => {
  try {
    const { leave_id, to_employee_id, handover_notes, is_admin_initiated } = req.body;
    const from_employee_id = is_admin_initiated ? req.body.from_employee_id : req.user.employee_id;

    // Validate input
    if (!validateObjectId(leave_id) || !validateObjectId(to_employee_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leave or employee ID'
      });
    }

    // Get leave details
    const leave = await Leave.findById(leave_id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave not found'
      });
    }

    // Check if leave is approved
    if (leave.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        error: 'Can only create handovers for approved leaves'
      });
    }

    // Check if the employee is on leave during the handover period
    const isOnLeave = await isEmployeeOnLeave(to_employee_id, leave.start_date, leave.end_date);
    if (isOnLeave) {
      return res.status(400).json({
        success: false,
        error: 'Cannot assign handover to an employee who is on leave during this period'
      });
    }

    // Check for overlapping handovers
    const hasOverlap = await hasOverlappingHandovers(to_employee_id, leave.start_date, leave.end_date);
    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        error: 'Employee already has a handover during this period'
      });
    }

    // Create the handover
    const handover = new LeaveHandover({
      leave_id,
      from_employee_id,
      to_employee_id,
      handover_notes,
      is_admin_initiated
    });

    await handover.save();

    res.status(201).json({
      success: true,
      data: handover
    });
  } catch (error) {
    console.error('Error creating handover:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create handover'
    });
  }
};

exports.updateHandoverStatus = async (req, res) => {
  try {
    const { handoverId } = req.params;
    const { status } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const handover = await LeaveHandover.findById(handoverId);
    if (!handover) {
      return res.status(404).json({
        success: false,
        error: 'Handover not found'
      });
    }

    // Check if the user has permission to update this handover
    if (handover.to_employee_id.toString() !== req.user.employee_id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only '
      });
    }

    handover.status = status;
    await handover.save();

    res.json({
      success: true,
      data: handover
    });
  } catch (error) {
    console.error('Error updating handover status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update handover status'
    });
  }
};

exports.getHandoverHistory = async (req, res) => {
  try {
    const handovers = await LeaveHandover.find({
      $or: [
        { from_employee_id: req.user.employee_id },
        { to_employee_id: req.user.employee_id }
      ]
    })
      .populate('leave_id')
      .populate('from_employee_id')
      .populate('to_employee_id')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      handovers
    });
  } catch (error) {
    console.error('Error fetching handover history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch handover history'
    });
  }
};

exports.getAllHandovers = async (req, res) => {
  try {
    const handovers = await LeaveHandover.find()
      .populate('leave_id')
      .populate('from_employee_id')
      .populate('to_employee_id')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      handovers
    });
  } catch (error) {
    console.error('Error fetching all handovers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch handovers'
    });
  }
}; 