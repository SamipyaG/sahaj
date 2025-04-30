import mongoose from 'mongoose';
import Salary from '../models/Salary.js';
import Employee from '../models/Employee.js';
import cron from 'node-cron';
import SalaryConfig from '../models/salaryConfig.js';

// Tax configuration
const TAX_BRACKETS = [
  { limit: 500000, rate: 0 },
  { limit: 700000, rate: 0.10 },
  { limit: 1000000, rate: 0.20 },
  { limit: 2000000, rate: 0.30 },
  { limit: Infinity, rate: 0.36 }
];

// Calculate tax based on annual salary
const calculateTax = (annualSalary) => {
  let tax = 0;
  let remainingSalary = annualSalary;
  
  for (let i = 1; i < TAX_BRACKETS.length; i++) {
    const prevBracket = TAX_BRACKETS[i-1];
    const currentBracket = TAX_BRACKETS[i];
    
    if (remainingSalary > prevBracket.limit) {
      const taxableAmount = Math.min(remainingSalary, currentBracket.limit) - prevBracket.limit;
      tax += taxableAmount * currentBracket.rate;
    } else {
      break;
    }
  }
  
  return tax;
};

// Track active cron job
let activeCronJob = null;

// Safe salary generation wrapper
const safeSalaryGeneration = async () => {
  try {
    await generateMonthlySalaries();
  } catch (error) {
    console.error('Error in salary generation:', error.message);
  }
};

// Generate monthly salaries (without transactions for development)
export const generateMonthlySalaries = async () => {
  try {
    console.log('Starting monthly salary generation...');
    const employees = await Employee.find({ active: true })
      .populate('designation_id');

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const usedSalaryIds = new Set(
      await Salary.distinct('salary_id')
    );

    const salaryPromises = employees.map(async (employee) => {
      if (!employee.designation_id || new Date(employee.join_date) > currentDate) {
        return;
      }

      const existingSalary = await Salary.findOne({
        employee_id: employee._id,
        pay_date: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      });

      if (!existingSalary) {
        let salaryId;
        do {
          salaryId = Math.floor(100000 + Math.random() * 900000);
        } while (usedSalaryIds.has(salaryId));
        usedSalaryIds.add(salaryId);

        const annualSalary = employee.designation_id.basic_salary * 12;
        const monthlyTax = calculateTax(annualSalary) / 12;

        const newSalary = new Salary({
          employee_id: employee._id,
          designation_id: employee.designation_id._id,
          salary_id: salaryId,
          pay_date: new Date(currentYear, currentMonth, 28),
          tax: monthlyTax,
          allowances: employee.allowances || 0,
          deductions: employee.deductions || 0
        });

        await newSalary.save();
      }
    });

    await Promise.all(salaryPromises);
    console.log('Monthly salary generation completed successfully');
  } catch (error) {
    console.error('Error in monthly salary generation:', error);
    throw error;
  }
};

// Helper function to restart cron job
const restartCronJob = async (config) => {
  if (activeCronJob) {
    activeCronJob.stop();
    console.log('Stopped previous cron job');
  }

  if (config.schedule_type === 'monthly') {
    activeCronJob = cron.schedule(`0 9 ${config.day_of_month} * *`, safeSalaryGeneration, {
      timezone: "Asia/Kolkata"
    });
    console.log(`Salary processing scheduled for day ${config.day_of_month} at 9 AM IST`);
  } else {
    activeCronJob = cron.schedule(`*/${config.custom_minutes} * * * *`, safeSalaryGeneration, {
      timezone: "Asia/Kolkata"
    });
    console.log(`Salary processing every ${config.custom_minutes} minutes (TEST MODE)`);
  }
};
export const initSalaryCronJob = () => {
  cron.schedule('0 9 28 * *', generateMonthlySalaries, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  console.log('Salary cron job initialized');
};

// Get salary payment status
export const getPaidStatus = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const status = await Salary.aggregate([
      {
        $match: {
          pay_date: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$pay_date" },
            month: { $month: "$pay_date" }
          },
          count: { $sum: 1 },
          employees: {
            $push: {
              name: "$employee_id.name",
              employeeId: "$employee_id.employeeId"
            }
          }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    const formatted = status.map((item, index) => ({
      sn: index + 1,
      year: item._id.year,
      month: new Date(0, item._id.month - 1).toLocaleString('default', { month: 'long' }),
      status: item.count > 0 ? 'Processed' : 'Pending',
      paidCount: item.count,
      employees: item.employees
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch salary status" 
    });
  }
};

// Get employee salary history
export const getEmployeeSalaries = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    let employee = await Employee.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(id) ? id : null },
        { employeeId: id }
      ]
    }).populate('designation_id');

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: "Employee not found" 
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { pay_date: -1 },
      populate: [
        { path: 'employee_id', select: 'name employeeId' },
        { path: 'designation_id', select: 'name basic_salary' }
      ]
    };

    const salaries = await Salary.paginate(
      { employee_id: employee._id },
      options
    );

    res.status(200).json({ 
      success: true, 
      data: salaries 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch salary records" 
    });
  }
};