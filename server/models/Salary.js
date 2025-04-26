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
    
    deductions: { 
      type: Number, 
      default: 0 
    },
    Paydate: { 
      type: Date, 
      required: true 
    }
  },
  { 
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    toJSON: { virtuals: true }, // Ensure virtual fields are included in JSON output
    toObject: { virtuals: true } // Ensure virtual fields are included in object output
  }
);

// Virtual field for `net_salary`
salarySchema.virtual('net_salary').get(function() {
  // Fetch basic_salary from the referenced Designation document
  return this.designation_id.basic_salary + this.allowances - this.deductions;
});

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;