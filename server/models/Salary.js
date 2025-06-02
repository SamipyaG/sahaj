import mongoose from "mongoose";
import { Schema } from "mongoose";

const salarySchema = new Schema(
  {
    employee_id: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    designation_id: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
      required: true
    },
    leave_id: {
      type: Schema.Types.ObjectId,
      ref: 'Leave'
    },
    salary_type: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: true,
      default: 'monthly'
    },
    pay_date: {
      type: Date,
      required: true,
      validate: {
        validator: function (date) {
          return date <= new Date();
        },
        message: "Pay date cannot be in the future"
      }
    },
    tax: {
      type: Number,
      required: true,
      min: 0
    },
    net_salary: {
      type: Number,
      required: true,
      min: 0
    },
    week_number: {
      type: Number,
      min: 1,
      max: 53,
      validate: {
        validator: function (v) {
          return this.salary_type === 'weekly' ? v >= 1 && v <= 53 : true;
        },
        message: 'Week number must be between 1 and 53 for weekly salaries'
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for basic salary (from designation)
salarySchema.virtual('basic_salary').get(function () {
  if (!this.populated('designation_id')) {
    return 0;
  }
  return this.salary_type === 'weekly'
    ? this.designation_id.basic_salary / 4
    : this.designation_id.basic_salary;
});

// Virtual field for allowances (from designation)
salarySchema.virtual('allowances').get(function () {
  if (!this.populated('designation_id')) {
    return 0;
  }
  return this.salary_type === 'weekly'
    ? this.designation_id.allowance / 4
    : this.designation_id.allowance;
});

// Virtual field for leave deduction
salarySchema.virtual('leave_deduction').get(function () {
  if (!this.populated('leave_id')) {
    return 0;
  }

  const perDaySalary = this.basic_salary / (this.salary_type === 'weekly' ? 7 : 30);
  if (this.leave_id.deductSalary || this.leave_id.noRestrictions) {
    const days = Math.ceil((new Date(this.leave_id.endDate) - new Date(this.leave_id.startDate)) / (1000 * 60 * 60 * 24)) + 1;
    return days * perDaySalary;
  }
  return 0;
});

// Pre-save middleware to calculate net salary
salarySchema.pre('save', async function (next) {
  try {
    if (this.isModified('tax') || this.isModified('leave_id')) {
      const basicSalary = this.basic_salary;
      const allowances = this.allowances;
      const leaveDeduction = this.leave_deduction;
      this.net_salary = basicSalary + allowances - this.tax - leaveDeduction;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual field for gross salary
salarySchema.virtual('gross_salary').get(function () {
  return this.basic_salary + this.allowances;
});

// Performance indexes
salarySchema.index({ employee_id: 1 });
salarySchema.index({ pay_date: -1 });
salarySchema.index({ salary_type: 1, week_number: 1 });

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;