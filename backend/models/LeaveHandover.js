const mongoose = require('mongoose');

const leaveHandoverSchema = new mongoose.Schema({
  leave_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave',
    required: true
  },
  from_employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  to_employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  handover_notes: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  is_admin_initiated: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
leaveHandoverSchema.index({ leave_id: 1, to_employee_id: 1 });
leaveHandoverSchema.index({ from_employee_id: 1 });
leaveHandoverSchema.index({ to_employee_id: 1 });

// Pre-save middleware to update the updated_at timestamp
leaveHandoverSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

const LeaveHandover = mongoose.model('LeaveHandover', leaveHandoverSchema);

module.exports = LeaveHandover; 