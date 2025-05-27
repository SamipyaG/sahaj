import TaskHandover from "../models/TaskHandover.js";
import User from "../models/User.js";
import Leave from "../models/Leave.js";
import Notification from "../models/Notification.js";

// Create Employee-Initiated Handover
export const createHandover = async (req, res) => {
  try {
    const { leaveId, toEmployee, tasks } = req.body;

    if (!leaveId || !toEmployee || !tasks) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: leaveId, toEmployee, or tasks"
      });
    }

    // Verify leave exists and belongs to the user
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, error: "Leave not found" });
    }

    if (leave.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized to create handover for this leave" });
    }

    // Verify fromEmployee and toEmployee are in same department
    const [fromEmp, toEmp] = await Promise.all([
      User.findById(req.user._id),
      User.findById(toEmployee)
    ]);

    if (!fromEmp || !toEmp) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    if (fromEmp.department !== toEmp.department) {
      return res.status(400).json({ success: false, error: "Can only handover to same department" });
    }

    // Check if toEmployee is on leave
    const toEmployeeLeave = await Leave.findOne({
      userId: toEmployee,
      status: "Approved",
      startDate: { $lte: leave.endDate },
      endDate: { $gte: leave.startDate }
    });

    if (toEmployeeLeave) {
      return res.status(400).json({
        success: false,
        error: "Selected employee is on leave during this period"
      });
    }

    // Validate tasks
    if (!Array.isArray(tasks) || tasks.length === 0 || tasks.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Must provide 1-10 tasks"
      });
    }

    // Validate task fields
    for (const task of tasks) {
      if (!task.title) {
        return res.status(400).json({
          success: false,
          error: "All tasks must have a title"
        });
      }
      if (task.deadline && new Date(task.deadline) <= new Date(leave.endDate)) {
        return res.status(400).json({
          success: false,
          error: "Task deadline must be after leave end date"
        });
      }
    }

    const handover = await TaskHandover.create({
      leaveId,
      fromEmployee: req.user._id,
      toEmployee,
      tasks,
      department: fromEmp.department
    });

    // Send notification to toEmployee
    await Notification.create({
      recipient: toEmployee,
      message: `New task handover from ${fromEmp.name}`,
      type: 'handover',
      relatedId: handover._id
    });

    res.status(201).json({ success: true, data: handover });
  } catch (error) {
    console.error('Error in createHandover:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin force-assign handover
export const adminCreateHandover = async (req, res) => {
  try {
    const { leaveId, fromEmployee, toEmployee, tasks } = req.body;

    // Verify leave exists
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, error: "Leave not found" });
    }

    // Verify employees exist and are in same department
    const [fromEmp, toEmp] = await Promise.all([
      User.findById(fromEmployee),
      User.findById(toEmployee)
    ]);

    if (!fromEmp || !toEmp) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    if (fromEmp.department !== toEmp.department) {
      return res.status(400).json({ success: false, error: "Employees must be in same department" });
    }

    const handover = await TaskHandover.create({
      leaveId,
      fromEmployee,
      toEmployee,
      tasks,
      department: fromEmp.department,
      isAdminInitiated: true,
      handoverStatus: 'Accepted' // Auto-accept admin assignments
    });

    // Send notification to both employees
    await Promise.all([
      Notification.create({
        recipient: fromEmployee,
        message: `Admin has assigned your tasks to ${toEmp.name}`,
        type: 'handover',
        relatedId: handover._id
      }),
      Notification.create({
        recipient: toEmployee,
        message: `Admin has assigned you tasks from ${fromEmp.name}`,
        type: 'handover',
        relatedId: handover._id
      })
    ]);

    res.status(201).json({ success: true, data: handover });
  } catch (error) {
    console.error('Error in adminCreateHandover:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Respond to handover (Accept/Reject)
export const respondToHandover = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const handover = await TaskHandover.findById(id);
    if (!handover) {
      return res.status(404).json({ success: false, error: "Handover not found" });
    }

    // Verify user is the assignee
    if (handover.toEmployee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized to respond to this handover" });
    }

    // Verify handover is pending
    if (handover.handoverStatus !== 'Pending') {
      return res.status(400).json({ success: false, error: "Handover already processed" });
    }

    handover.handoverStatus = status;
    handover.responseDate = new Date();
    handover.responseComment = comment;

    await handover.save();

    // Send notification to original employee
    const fromEmployee = await User.findById(handover.fromEmployee);
    await Notification.create({
      recipient: handover.fromEmployee,
      message: `${req.user.name} has ${status.toLowerCase()} your task handover`,
      type: 'handover',
      relatedId: handover._id
    });

    res.status(200).json({ success: true, data: handover });
  } catch (error) {
    console.error('Error in respondToHandover:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all handovers for an employee
export const getEmployeeHandovers = async (req, res) => {
  try {
    const handovers = await TaskHandover.find({
      $or: [
        { fromEmployee: req.user._id },
        { toEmployee: req.user._id }
      ]
    })
      .populate('fromEmployee', 'name email')
      .populate('toEmployee', 'name email')
      .populate('leaveId', 'startDate endDate')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: handovers });
  } catch (error) {
    console.error('Error in getEmployeeHandovers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get handovers for a specific leave
export const getLeaveHandovers = async (req, res) => {
  try {
    const { leaveId } = req.params;

    // Verify user has access to this leave
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, error: "Leave not found" });
    }

    if (leave.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Not authorized to view these handovers" });
    }

    const handovers = await TaskHandover.find({ leaveId })
      .populate('fromEmployee', 'name email')
      .populate('toEmployee', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: handovers });
  } catch (error) {
    console.error('Error in getLeaveHandovers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}; 