import mongoose from "mongoose";
import { Schema } from "mongoose";

const leaveSetupSchema = new Schema({
  leaveType: { type: String, required: true, unique: true }, // Leave type (e.g., Sick Leave, Casual Leave)
  maxDays: { type: Number, required: true }, // Maximum allowed days for this leave type
  description: { type: String }, // Optional description
  deductSalary: {
    type: Boolean,
    default: false
  }, // Whether this leave type should deduct salary
  noRestrictions: {
    type: Boolean,
    default: false
  }, // Whether this leave type has no restrictions on number of days
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add validation to ensure maxDays is not required for unrestricted leaves
leaveSetupSchema.pre('save', function (next) {
  if (this.noRestrictions) {
    this.maxDays = 0; // Set maxDays to 0 for unrestricted leaves
  }
  next();
});

const LeaveSetup = mongoose.model("LeaveSetup", leaveSetupSchema);
export default LeaveSetup;
