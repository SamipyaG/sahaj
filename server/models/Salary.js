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
        validator: function(date) {
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
    allowances: {
      type: Number,
      default: 0,
      min: 0
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for net_salary with safe access
salarySchema.virtual('net_salary').get(function() {
  const basic = this.designation_id?.basic_salary || 0;
  return basic + (this.allowances || 0) - (this.tax || 0) - (this.deductions || 0);
});

// Performance indexes (removed duplicate salary_id index)
salarySchema.index({ employee_id: 1 });
salarySchema.index({ pay_date: -1 });

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;