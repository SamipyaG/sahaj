import mongoose from "mongoose";
import { Schema } from "mongoose";

const leaveSetupSchema = new Schema({
  leaveType: { type: String, required: true, unique: true }, // Leave type (e.g., Sick Leave, Casual Leave)
  maxDays: { type: Number, required: true }, // Maximum allowed days for this leave type
  description: { type: String }, // Optional description
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const LeaveSetup = mongoose.model("LeaveSetup", leaveSetupSchema);
export default LeaveSetup;
