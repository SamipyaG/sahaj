import mongoose from "mongoose";
import { Schema } from "mongoose";

const salaryConfigSchema = new Schema({
  schedule_type: {
    type: String,
    enum: ['monthly', 'custom'],
    default: 'monthly'
  },
  day_of_month: {
    type: Number,
    min: 1,
    max: 28,
    default: 28
  },
  custom_minutes: {
    type: Number,
    min: 1,
    default: 5
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const SalaryConfig = mongoose.model('SalaryConfig', salaryConfigSchema);
export default SalaryConfig;