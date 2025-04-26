import mongoose from "mongoose";
import { Schema } from "mongoose";

const designationSchema = new Schema({
  designation_id: { type: String, unique: true, required: true },
  title: { type: String, required: true },  // Updated from designation_name
  basic_salary: { type: Number, required: true },  // Updated to match new schema
  description: { type: String, required: false },  // Optional description
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Designation = mongoose.model('Designation', designationSchema);
export default Designation;
