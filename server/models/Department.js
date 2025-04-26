import mongoose from "mongoose";
import Employee from "./Employee.js";
import Leave from "./Leave.js";
import Salary from "./Salary.js";
import User from './User.js';

const departmentSchema = new mongoose.Schema({
    department_id: { type: String, unique: true, required: true }, // Primary key
    department_name: { type: String, required: true }, // Department name
    description: { type: String }, // Optional description
    employee_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }], // Foreign key (array of employee IDs)
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware to delete related records when a department is deleted
departmentSchema.pre("deleteOne", { document: true, query: false }, async function(next) {
    try {
        const employees = await Employee.find({ department: this.department_id });
        const empIds = employees.map(emp => emp._id);
        const userIds = employees.map(emp => emp.userId);

        await Employee.deleteMany({ department: this.department_id });
        await Leave.deleteMany({ employeeId: { $in: empIds } });
        await Salary.deleteMany({ employeeId: { $in: empIds } });
        await User.deleteMany({ _id: { $in: userIds } });

        next();
    } catch (error) {
        next(error);
    }
});

const Department = mongoose.model("Department", departmentSchema);
export default Department;
