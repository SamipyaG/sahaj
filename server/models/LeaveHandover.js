import mongoose from 'mongoose';

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
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  is_admin_initiated: {
    type: Boolean,
    default: false
  },
  handover_notes: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
leaveHandoverSchema.index({ from_employee_id: 1, created_at: -1 });
leaveHandoverSchema.index({ to_employee_id: 1, created_at: -1 });
leaveHandoverSchema.index({ leave_id: 1 });

const LeaveHandover = mongoose.model('LeaveHandover', leaveHandoverSchema);

export default LeaveHandover;
