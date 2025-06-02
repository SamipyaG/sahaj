import mongoose from "mongoose";
import { Schema } from "mongoose";

const salarySchema = new Schema(
  {
    employee_id: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    salary_id: {
      type: Number,
      required: true,
      unique: true
    },
    designation_id: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
      required: true
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
    salary_type: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: true,
      default: 'monthly'
    },
    tax: {
      type: Number,
      required: true,
      min: 0
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0
    },
    excess_leave_deduction: {
      type: Number,
      default: 0,
      min: 0
    },
    basic_salary_at_pay: {
      type: Number,
      required: true
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

// Virtual field for gross_salary
salarySchema.virtual('gross_salary').get(function () {
  return this.basic_salary_at_pay +
    (this.allowances || 0);
});

// Virtual field for net_salary with improved calculation
salarySchema.virtual('net_salary').get(function () {
  return this.gross_salary -
    (this.tax || 0) -
    (this.deductions || 0) -
    (this.excess_leave_deduction || 0);
});

// Performance indexes
salarySchema.index({ employee_id: 1 });
salarySchema.index({ pay_date: -1 });
salarySchema.index({ salary_type: 1, week_number: 1 });

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;