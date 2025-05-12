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
    const prevBracket = TAX_BRACKETS[i - 1];
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
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Set the date 10 months ago (11 months total including current)
    const elevenMonthsAgo = new Date(now);
    elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 10);
    elevenMonthsAgo.setDate(1);
    elevenMonthsAgo.setHours(0, 0, 0, 0);

    const allMonths = [];
    const tempDate = new Date(elevenMonthsAgo);

    while (tempDate <= now) {
      allMonths.push({
        year: tempDate.getFullYear(),
        month: tempDate.getMonth() + 1,
        monthName: tempDate.toLocaleString('default', { month: 'long' })
      });
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    const processedData = await Salary.aggregate([
      {
        $match: {
          pay_date: { $gte: elevenMonthsAgo, $lte: now }
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
              name: "$employee_name",
              employeeId: "$employee_id"
            }
          }
        }
      }
    ]);

    const formatted = allMonths.map((month, index) => {
      const processedMonth = processedData.find(
        item => item._id.year === month.year && item._id.month === month.month
      );

      return {
        sn: index + 1,
        year: month.year,
        month: month.monthName,
        monthNum: month.month,
        status: processedMonth ? 'Processed' : 'Pending',
        paidCount: processedMonth ? processedMonth.count : 0,
        employees: processedMonth ? processedMonth.employees : []
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthNum - a.monthNum;
    });

    res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error("Salary Status Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch salary status",
      details: error.message
    });
  }
};

// Get employee salary history
export const getEmployeeSalaries = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // First find the employee
    let employee = await Employee.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(id) ? id : null },
        { employeeId: id },
        { user_id: id }
      ]
    }).populate('designation_id');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // Find salaries with proper population
    const salaries = await Salary.find({ employee_id: employee._id })
      .populate('designation_id', 'title basic_salary')
      .sort({ pay_date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Salary.countDocuments({ employee_id: employee._id });

    res.status(200).json({
      success: true,
      data: {
        docs: salaries,
        totalDocs: total,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        page: parseInt(page),
        pagingCounter: (page - 1) * limit + 1,
        hasPrevPage: page > 1,
        hasNextPage: page * limit < total,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page * limit < total ? page + 1 : null
      }
    });
  } catch (error) {
    console.error("Salary fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch salary records",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};