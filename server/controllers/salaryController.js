import Salary from '../models/Salary.js';
import Employee from '../models/Employee.js';
import Designation from '../models/Designation.js';
import cron from 'node-cron';

// Calculate tax based on annual salary (using your existing logic)
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

// Generate monthly salaries for all eligible employees
const generateMonthlySalaries = async () => {
    try {
        console.log('Running monthly salary generation...');
        const employees = await Employee.find({ active: true }).populate('designation_id');
        const usedSalaryIds = new Set(await Salary.distinct('salary_id'));
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        for (const employee of employees) {
            const { _id: employee_id, designation_id, join_date } = employee;
            
            // Skip if employee hasn't joined yet or has no designation
            if (new Date(join_date) > currentDate || !designation_id) continue;

            // Check if salary already exists for this month
            const existingSalary = await Salary.findOne({
                employee_id,
                Paydate: { 
                    $gte: new Date(currentYear, currentMonth, 1),
                    $lt: new Date(currentYear, currentMonth + 1, 1)
                }
            });

            if (!existingSalary) {
                // Generate unique salary_id
                let salary_id;
                do {
                    salary_id = Math.floor(100000 + Math.random() * 900000);
                } while (usedSalaryIds.has(salary_id));
                usedSalaryIds.add(salary_id);

                // Calculate monthly tax (annual tax divided by 12)
                const annualSalary = designation_id.basic_salary * 12;
                const monthlyTax = calculateTax(annualSalary) / 12;

                const newSalary = new Salary({
                    employee_id,
                    designation_id: designation_id._id,
                    salary_id,
                    Paydate: new Date(currentYear, currentMonth, 28), // Pay on 28th
                    tax: monthlyTax
                });

                await newSalary.save();
                console.log(`Generated salary for employee ${employee_id} for ${currentMonth + 1}/${currentYear}`);
            }
        }
        console.log('Monthly salary generation completed successfully');
    } catch (error) {
        console.error('Error in monthly salary generation:', error.message);
    }
};

// Initialize the cron job for automatic salary payment
const initSalaryCronJob = () => {
    // Schedule to run at 9:00 AM on the 28th day of every month
    cron.schedule('0 9 28 * *', () => {
        console.log('Running scheduled salary payment...');
        generateMonthlySalaries();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Adjust to your timezone
    });
    
    console.log('Salary cron job initialized - will run on 28th of each month');
};

// Get all salary records for a specific employee
const getEmployeeSalaries = async (req, res) => {
    try {
        const { employee_id } = req.params;

        // Validate employee_id format
        if (!mongoose.Types.ObjectId.isValid(employee_id)) {
            return res.status(400).json({ success: false, error: "Invalid employee ID format" });
        }

        const salaryRecords = await Salary.find({ employee_id })
            .sort({ Paydate: -1 })
            .populate('employee_id', 'name employeeId')
            .populate({
                path: 'designation_id',
                select: 'name basic_salary'
            });

        if (!salaryRecords || salaryRecords.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No salary records found for this employee" 
            });
        }

        // Format response with calculated values
        const formattedSalaries = salaryRecords.map(record => ({
            salary_id: record.salary_id,
            pay_date: record.Paydate,
            basic_salary: record.designation_id.basic_salary,
            tax_deducted: record.tax,
            net_salary: record.net_salary, // Virtual field from model
            designation: record.designation_id.name
        }));

        return res.status(200).json({ 
            success: true, 
            data: formattedSalaries 
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Error fetching salary records" 
        });
    }
};

export { initSalaryCronJob, getEmployeeSalaries };