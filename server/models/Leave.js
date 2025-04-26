import mongoose from "mongoose";
import { Schema } from "mongoose";

const leaveSchema = new Schema(
  {
    leave_id: { type: String, required: true, unique: true }, // Primary Key
    employee_id: { type: Schema.Types.ObjectId, ref: "Employee", required: true }, // Foreign Key to Employee
    leave_setup_id: { type: Schema.Types.ObjectId, ref: "LeaveSetup", required: true }, // Foreign Key to LeaveSetup
    numOfDays: { type: Number, required: true }, // Number of leave days
    reason: { type: String, required: true }, // Reason for leave
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    }, // Leave status
    appliedAt: { type: Date, default: Date.now }, // Timestamp when leave was applied
    updatedAt: { type: Date, default: Date.now }, // Timestamp of last update
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt` fields
);

const Leave = mongoose.model("Leave", leaveSchema);
export default Leave;