import mongoose from "mongoose";
import { Schema } from "mongoose";

const employeeSchema = new Schema({
  employee_id: { 
    type: String, 
    required: [true, "Employee ID is required"], 
    unique: true,
    index: true,  // Explicitly add index
    trim: true    // Trim whitespace
  },
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "User reference is required"] 
  },
  department_id: { 
    type: Schema.Types.ObjectId, 
    ref: "Department", 
    required: [true, "Department is required"] 
  },
  designation_id: { 
    type: Schema.Types.ObjectId, 
    ref: "Designation", 
    required: [true, "Designation is required"] 
  },
  employee_name: { 
    type: String, 
    required: [true, "Employee name is required"] 
  },
  date_of_birth: { 
    type: Date 
  },
  gender: { 
    type: String, 
    enum: ["Male", "Female", "Other"] 
  },
  marital_status: { 
    type: String, 
    enum: ["single", "married", "divorced", "widowed"] 
  },
  join_date: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;