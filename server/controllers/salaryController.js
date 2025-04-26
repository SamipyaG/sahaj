import Salary from '../models/Salary.js';
import Employee from '../models/Employee.js';
import Designation from '../models/Designation.js';

// Function to calculate the number of months since joining
const calculateMonthsSinceJoining = (joinDate) => {
    const join = new Date(joinDate);
    const now = new Date();
    return (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
};

// Function to calculate tax based on annual salary
const calculateTax = (annualSalary) => {
    if (annualSalary <= 500000) return 0; // No tax for salaries below 500,000

    let tax = 0, remainingSalary = annualSalary;

    if (remainingSalary > 2000000) {
        tax += (remainingSalary - 2000000) * 0.36;
        remainingSalary = 2000000;
    }
    if (remainingSalary > 1000000) {
        tax += (remainingSalary - 1000000) * 0.30;
        remainingSalary = 1000000;
    }
    if (remainingSalary > 700000) {
        tax += (remainingSalary - 700000) * 0.20;
        remainingSalary = 700000;
    }
    if (remainingSalary > 500000) {
        tax += (remainingSalary - 500000) * 0.10;
    }

    return tax;
};

// Automatically generate and pay salary slips for all employees
const autoPaySalaries = async (req, res) => {
    try {
        // Fetch all employees and their designations
        const employees = await Employee.find().populate('designation_id');

        for (const employee of employees) {
            const { _id: employee_id, designation_id, join_date } = employee;
            const { basic_salary } = designation_id;

            // Ensure deductions are properly fetched
            const existingSalary = await Salary.findOne({ employee_id });
            const deductions = existingSalary ? existingSalary.deductions : 0;

            // Calculate months since joining
            const monthsSinceJoining = calculateMonthsSinceJoining(join_date);

            for (let i = 0; i < monthsSinceJoining; i++) {
                // Calculate gross and net salary
                const grossAnnualSalary = (basic_salary - deductions) * 12;
                const annualTax = calculateTax(grossAnnualSalary);
                const monthlyTax = annualTax / 12;
                const netSalary = (basic_salary - deductions) - monthlyTax;

                // Determine pay date for the month
                const payDate = new Date(join_date);
                payDate.setMonth(payDate.getMonth() + i + 1);

                // Check if salary for this month already exists
                const existingSalarySlip = await Salary.findOne({
                    employee_id,
                    pay_date: { $gte: new Date(payDate.getFullYear(), payDate.getMonth(), 1) },
                });

                if (!existingSalarySlip) {
                    const newSalary = new Salary({
                        employee_id,
                        designation_id: designation_id._id,
                        basic_salary,
                        deductions,
                        net_salary: netSalary,
                        pay_date: payDate
                    });
                    await newSalary.save();
                }
            }
        }

        return res.status(200).json({ success: true, message: "Salary slips generated successfully" });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: "Error auto-paying salaries" });
    }
};

// Add a new salary entry (for manual addition)
const addSalary = async (req, res) => {
    try {
        const { employee_id, pay_date } = req.body;

        const employee = await Employee.findById(employee_id).populate('designation_id');
        if (!employee) return res.status(404).json({ success: false, error: "Employee not found" });

        const { basic_salary } = employee.designation_id;

        // Ensure deductions are properly fetched
        const existingSalary = await Salary.findOne({ employee_id });
        const deductions = existingSalary ? existingSalary.deductions : 0;

        // Calculate net salary
        const grossAnnualSalary = (basic_salary - deductions) * 12;
        const annualTax = calculateTax(grossAnnualSalary);
        const monthlyTax = annualTax / 12;
        const netSalary = (basic_salary - deductions) - monthlyTax;

        // Check if salary already exists for this pay date
        const existingSalarySlip = await Salary.findOne({
            employee_id,
            pay_date: { $gte: new Date(pay_date) },
        });

        if (existingSalarySlip) {
            return res.status(400).json({ success: false, error: "Salary slip already exists for this period" });
        }

        // Create new salary entry
        const newSalary = new Salary({
            employee_id,
            designation_id: employee.designation_id._id,
            basic_salary,
            deductions,
            net_salary: netSalary,
            pay_date
        });

        await newSalary.save();

        return res.status(200).json({
            success: true,
            message: "Salary added successfully",
            salary: newSalary,
            netSalary,
            monthlyTax
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: "Error adding salary" });
    }
};

// Get salary history for an employee
const getSalary = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id).populate('designation_id');

        if (!employee) return res.status(404).json({ success: false, error: "Employee not found" });

        const salaryRecords = await Salary.find({ employee_id: id }).sort({ pay_date: -1 });

        return res.status(200).json({ success: true, salaryRecords });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: "Error fetching salary records" });
    }
};

export { autoPaySalaries, addSalary, getSalary };
