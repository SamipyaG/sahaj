import mongoose from "mongoose";

const taskHandoverSchema = new mongoose.Schema({
  leaveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave',
    required: [true, 'Leave ID is required']
  },
  fromEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'From employee is required']
  },
  toEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'To employee is required']
  },
  tasks: [{
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    deadline: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v > new Date();
        },
        message: 'Deadline must be in the future'
      }
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be Low, Medium, or High'
      },
      default: 'Medium'
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: 'Status must be Pending, In Progress, or Completed'
      },
      default: 'Pending'
    }
  }],
  handoverStatus: {
    type: String,
    enum: {
      values: ['Pending', 'Accepted', 'Rejected'],
      message: 'Handover status must be Pending, Accepted, or Rejected'
    },
    default: 'Pending'
  },
  isAdminInitiated: {
    type: Boolean,
    default: false
  },
  handoverDate: {
    type: Date,
    default: Date.now
  },
  responseDate: Date,
  responseComment: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  }
}, {
  timestamps: true
});

// Validate tasks array
taskHandoverSchema.pre('save', function (next) {
  if (!this.tasks || this.tasks.length === 0 || this.tasks.length > 10) {
    next(new Error('Must provide 1-10 tasks'));
  }
  next();
});

// Indexes for better query performance
taskHandoverSchema.index({ fromEmployee: 1, handoverStatus: 1 });
taskHandoverSchema.index({ toEmployee: 1, handoverStatus: 1 });
taskHandoverSchema.index({ leaveId: 1 });
taskHandoverSchema.index({ department: 1 });

const TaskHandover = mongoose.model("TaskHandover", taskHandoverSchema);
export default TaskHandover; 