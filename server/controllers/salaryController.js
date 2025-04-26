import Salary from '../models/Salary.js';
import Employee from '../models/Employee.js';
import Designation from '../models/Designation.js';

const calculateMonthsSinceJoining = (joinDate) => {
    const join = new Date(joinDate);
    const now = new Date();
    return (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
};

const calculateTax = (annualSalary) => {
    if (annualSalary <= 500000) return 0;
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

const autoPaySalaries = async (req, res) => {
    try {
        const employees = await Employee.find().populate('designation_id');
        const usedSalaryIds = new Set();

        for (const employee of employees) {
            const { _id: employee_id, designation_id, join_date } = employee;
            const monthsSinceJoining = calculateMonthsSinceJoining(join_date);

            for (let i = 0; i < monthsSinceJoining; i++) {
                const payDate = new Date(join_date);
                payDate.setMonth(payDate.getMonth() + i + 1);

                const existingSalary = await Salary.findOne({
                    employee_id,
                    Paydate: { $gte: new Date(payDate.getFullYear(), payDate.getMonth(), 1) },
                });

                if (!existingSalary) {
                    // Generate unique salary_id
                    let salary_id;
                    do {
                        salary_id = Math.floor(100000 + Math.random() * 900000);
                    } while (usedSalaryIds.has(salary_id));
                    usedSalaryIds.add(salary_id);

                    const newSalary = new Salary({
                        employee_id,
                        designation_id: designation_id._id,
                        salary_id,
                        Paydate: payDate
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

const addSalary = async (req, res) => {
    try {
        const { employee_id, Paydate } = req.body;
        const employee = await Employee.findById(employee_id).populate('designation_id');
        if (!employee) return res.status(404).json({ success: false, error: "Employee not found" });

        // Generate unique salary_id
        const usedIds = await Salary.distinct('salary_id');
        let salary_id;
        do {
            salary_id = Math.floor(100000 + Math.random() * 900000);
        } while (usedIds.includes(salary_id));

        const existingSalary = await Salary.findOne({
            employee_id,
            Paydate: { $gte: new Date(Paydate) },
        });

        if (existingSalary) {
            return res.status(400).json({ success: false, error: "Salary slip already exists for this period" });
        }

        const newSalary = new Salary({
            employee_id,
            designation_id: employee.designation_id._id,
            salary_id,
            Paydate
        });

        await newSalary.save();
        return res.status(200).json({
            success: true,
            message: "Salary added successfully",
            salary: newSalary
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: "Error adding salary" });
    }
};

const getSalary = async (req, res) => {
    try {
        const { id } = req.params;
        const salaryRecords = await Salary.find({ employee_id: id })
            .sort({ Paydate: -1 })
            .populate('employee_id', 'employeeId')
            .populate('designation_id', 'name basic_salary');

        return res.status(200).json({ 
            success: true, 
            salary: salaryRecords.map(record => ({
                ...record.toObject(),
                net_salary: record.net_salary // Include virtual field
            }))
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: "Error fetching salary records" });
    }
};

export { autoPaySalaries, addSalary, getSalary };