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
    Paydate: { 
      type: Date, 
      required: true 
    },
    tax:
  {
    type:Number,
    require:true
  }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for `net_salary`
salarySchema.virtual('net_salary').get(function() {
  return this.designation_id.basic_salary + (this.allowances || 0);
});

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;