import mongoose from 'mongoose';
import Salary from '../models/Salary.js';
import Employee from '../models/Employee.js';
import cron from 'node-cron';
import SalaryConfig from '../models/salaryConfig.js';
import Leave from '../models/Leave.js';

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

// Helper function to get week number
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Generate weekly salaries
export const generateWeeklySalaries = async () => {
  try {
    console.log('Starting weekly salary generation...');
    console.log('Current time:', new Date().toISOString());

    const employees = await Employee.find({ active: true })
      .populate('designation_id');

    console.log(`Found ${employees.length} active employees`);

    const currentDate = new Date();
    const currentWeek = getWeekNumber(currentDate);
    const currentYear = currentDate.getFullYear();

    console.log(`Processing for week: ${currentWeek}, year: ${currentYear}`);

    const usedSalaryIds = new Set(
      await Salary.distinct('salary_id')
    );

    let processedCount = 0;
    let skippedCount = 0;

    const salaryPromises = employees.map(async (employee) => {
      if (!employee.designation_id || new Date(employee.join_date) > currentDate) {
        console.log(`Skipping employee ${employee._id}: No designation or joined after current date`);
        skippedCount++;
        return;
      }

      // Check for existing weekly salary
      const existingSalary = await Salary.findOne({
        employee_id: employee._id,
        salary_type: 'weekly',
        week_number: currentWeek,
        pay_date: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1)
        }
      });

      if (!existingSalary) {
        let salaryId;
        do {
          salaryId = Math.floor(100000 + Math.random() * 900000);
        } while (usedSalaryIds.has(salaryId));
        usedSalaryIds.add(salaryId);

        // Calculate weekly basic salary (monthly salary / 4)
        const weeklyBasicSalary = employee.designation_id.basic_salary / 4;

        // Calculate weekly tax (monthly tax / 4)
        const annualSalary = employee.designation_id.basic_salary * 12;
        const monthlyTax = calculateTax(annualSalary) / 12;
        const weeklyTax = monthlyTax / 4;

        // Calculate weekly allowances and deductions
        const weeklyAllowances = (employee.allowances || 0) / 4;
        const weeklyDeductions = (employee.deductions || 0) / 4;

        const newSalary = new Salary({
          employee_id: employee._id,
          designation_id: employee.designation_id._id,
          salary_id: salaryId,
          salary_type: 'weekly',
          pay_date: new Date(currentDate),
          week_number: currentWeek,
          tax: weeklyTax,
          allowances: weeklyAllowances,
          deductions: weeklyDeductions,
          basic_salary_at_pay: weeklyBasicSalary
        });

        await newSalary.save();
        processedCount++;
        console.log(`Generated weekly salary for employee ${employee._id} with salary ID: ${salaryId}`);
      } else {
        console.log(`Weekly salary already exists for employee ${employee._id} for week ${currentWeek}`);
        skippedCount++;
      }
    });

    await Promise.all(salaryPromises);
    console.log('Weekly salary generation completed successfully');
    console.log(`Processed: ${processedCount}, Skipped: ${skippedCount}, Total: ${employees.length}`);
  } catch (error) {
    console.error('Error in weekly salary generation:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

// Generate monthly salaries
export const generateMonthlySalaries = async () => {
  try {
    console.log('Starting monthly salary generation...');
    console.log('Current time:', new Date().toISOString());

    const employees = await Employee.find({ active: true })
      .populate('designation_id');

    console.log(`Found ${employees.length} active employees`);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    console.log(`Processing for month: ${currentMonth + 1}, year: ${currentYear}`);

    const usedSalaryIds = new Set(
      await Salary.distinct('salary_id')
    );

    let processedCount = 0;
    let skippedCount = 0;

    const salaryPromises = employees.map(async (employee) => {
      if (!employee.designation_id || new Date(employee.join_date) > currentDate) {
        console.log(`Skipping employee ${employee._id}: No designation or joined after current date`);
        skippedCount++;
        return;
      }

      const existingSalary = await Salary.findOne({
        employee_id: employee._id,
        salary_type: 'monthly',
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

        // Calculate deductions for excess leave days in the current month
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        const approvedExcessLeaves = await Leave.find({
          employee_id: employee._id,
          status: "Approved",
          excessDays: { $gt: 0 },
          $or: [
            { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
            { endDate: { $gte: startOfMonth, $lte: endOfMonth } },
            { $and: [{ startDate: { $lte: startOfMonth } }, { endDate: { $gte: endOfMonth } }] }
          ]
        });

        let totalExcessLeaveDeduction = 0;
        if (approvedExcessLeaves.length > 0) {
          const perDaySalary = employee.designation_id.basic_salary / 30;
          approvedExcessLeaves.forEach(leave => {
            const applicableExcessDays = Math.min(leave.excessDays, calculateLeaveDays(Math.max(startOfMonth, leave.startDate), Math.min(endOfMonth, leave.endDate)));
            totalExcessLeaveDeduction += applicableExcessDays * perDaySalary;
          });
        }

        const newSalary = new Salary({
          employee_id: employee._id,
          designation_id: employee.designation_id._id,
          salary_id: salaryId,
          salary_type: 'monthly',
          pay_date: new Date(currentYear, currentMonth, 28),
          tax: monthlyTax,
          allowances: employee.allowances || 0,
          deductions: (employee.deductions || 0) + totalExcessLeaveDeduction,
          excess_leave_deduction: totalExcessLeaveDeduction,
          basic_salary_at_pay: employee.designation_id.basic_salary
        });

        await newSalary.save();
        processedCount++;
        console.log(`Generated monthly salary for employee ${employee._id} with salary ID: ${salaryId}`);
      } else {
        console.log(`Monthly salary already exists for employee ${employee._id} for this month`);
        skippedCount++;
      }
    });

    await Promise.all(salaryPromises);
    console.log('Monthly salary generation completed successfully');
    console.log(`Processed: ${processedCount}, Skipped: ${skippedCount}, Total: ${employees.length}`);
  } catch (error) {
    console.error('Error in monthly salary generation:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

// Get salary payment status
export const getPaidStatus = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

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

    const salaries = await Salary.find({ employee_id: employee._id })
      .populate('designation_id', 'title basic_salary')
      .sort({ pay_date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

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

// Test endpoint to manually trigger salary generation
export const testSalaryGeneration = async (req, res) => {
  try {
    console.log('Manually triggering salary generation at:', new Date().toISOString());
    await generateMonthlySalaries();
    res.status(200).json({
      success: true,
      message: 'Salary generation completed successfully'
    });
  } catch (error) {
    console.error('Error in test salary generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate salaries',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get monthly salary details
export const getMonthlySalaryDetails = async (req, res) => {
  try {
    const { year, month } = req.params;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const salaries = await Salary.find({
      pay_date: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate({
        path: 'employee_id',
        populate: [
          { path: 'department_id', select: 'department_name' },
          { path: 'user_id', select: 'name' }
        ]
      })
      .populate('designation_id', 'title basic_salary')
      .sort({ 'employee_id.user_id.name': 1 });

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(year),
        month: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
        monthNum: parseInt(month),
        salaries
      }
    });
  } catch (error) {
    console.error('Error fetching monthly salary details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly salary details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};