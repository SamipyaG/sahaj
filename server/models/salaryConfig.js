import mongoose from "mongoose";
import { Schema } from "mongoose";

const salaryConfigSchema = new Schema({
  schedule_type: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true,
    default: 'monthly'
  },
  payment_day: {
    type: Number,
    required: true,
    validate: {
      validator: function (v) {
        if (this.schedule_type === 'monthly') {
          return v >= 1 && v <= 28;
        } else {
          return v >= 0 && v <= 6;
        }
      },
      message: props => {
        if (props.value === undefined) return 'Payment day is required';
        if (props.value < 0 || props.value > 6) return 'Weekly payment day must be between 0-6 (Sunday-Saturday)';
        if (props.value < 1 || props.value > 28) return 'Monthly payment day must be between 1-28';
      }
    }
  },
  payment_time: {
    type: String,
    required: true,
    default: '09:00',
    validate: {
      validator: function (v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Payment time must be in HH:mm format (24-hour)'
    }
  },
  timezone: {
    type: String,
    required: true,
    default: 'Asia/Kolkata'
  },
  auto_generate: {
    type: Boolean,
    default: true
  },
  notify_employees: {
    type: Boolean,
    default: true
  },
  notify_admin: {
    type: Boolean,
    default: true
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for payment_day_name
salaryConfigSchema.virtual('payment_day_name').get(function () {
  if (this.schedule_type === 'weekly') {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][this.payment_day];
  }
  return `${this.payment_day}${this.getOrdinalSuffix(this.payment_day)}`;
});

// Helper method for ordinal suffix
salaryConfigSchema.methods.getOrdinalSuffix = function (n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

// Pre-save middleware to ensure payment_day is appropriate for schedule_type
salaryConfigSchema.pre('save', function (next) {
  if (this.schedule_type === 'monthly' && (this.payment_day < 1 || this.payment_day > 28)) {
    next(new Error('Monthly payment day must be between 1-28'));
  } else if (this.schedule_type === 'weekly' && (this.payment_day < 0 || this.payment_day > 6)) {
    next(new Error('Weekly payment day must be between 0-6 (Sunday-Saturday)'));
  }
  next();
});

const SalaryConfig = mongoose.model('SalaryConfig', salaryConfigSchema);
export default SalaryConfig;