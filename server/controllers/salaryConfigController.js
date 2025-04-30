import SalaryConfig from "../models/salaryConfig.js";
import cron from 'node-cron';
import { generateMonthlySalaries } from './salaryController.js';

// Helper function to restart cron job with new configuration
const restartCronJob = async (config) => {
  // Clear any existing cron jobs
  cron.getTasks().forEach(task => task.stop());

  if (config.schedule_type === 'monthly') {
    // Monthly schedule (e.g., 28th at 9 AM IST)
    cron.schedule(`0 9 ${config.day_of_month} * *`, generateMonthlySalaries, {
      timezone: "Asia/Kolkata"
    });
    console.log(`Salary processing scheduled for day ${config.day_of_month} of each month at 9 AM IST`);
  } else {
    // Custom interval for testing (e.g., every 5 minutes)
    cron.schedule(`*/${config.custom_minutes} * * * *`, generateMonthlySalaries, {
      timezone: "Asia/Kolkata"
    });
    console.log(`Salary processing scheduled every ${config.custom_minutes} minutes (TEST MODE)`);
  }
};

// Get current configuration
export const getSalaryConfig = async (req, res) => {
  try {
    let config = await SalaryConfig.findOne().sort({ createdAt: -1 }).lean();

    // If no config exists, return defaults and create one
    if (!config) {
      const defaultConfig = {
        schedule_type: 'monthly',
        day_of_month: 28,
        custom_minutes: 5,
        updated_by: req.user._id
      };

      config = await SalaryConfig.create(defaultConfig);
      await restartCronJob(defaultConfig);
    }

    // Remove sensitive fields before sending to client
    const { _id, __v, createdAt, updatedAt, ...responseData } = config;

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching salary config:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch salary configuration",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update configuration
export const updateSalaryConfig = async (req, res) => {
  try {
    const { schedule_type, day_of_month, custom_minutes } = req.body;

    // Validation
    if (!['monthly', 'custom'].includes(schedule_type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid schedule type"
      });
    }

    if (schedule_type === 'monthly' && (day_of_month < 1 || day_of_month > 28)) {
      return res.status(400).json({
        success: false,
        error: "Day of month must be between 1 and 28"
      });
    }

    if (schedule_type === 'custom' && (custom_minutes < 1 || custom_minutes > 1440)) {
      return res.status(400).json({
        success: false,
        error: "Custom minutes must be between 1 and 1440 (24 hours)"
      });
    }

    // Prepare update data
    const updateData = {
      schedule_type,
      day_of_month,
      custom_minutes,
      last_updated: new Date(),
      updated_by: req.user._id
    };

    // Find and update or create new config
    const config = await SalaryConfig.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Restart cron job with new configuration
    await restartCronJob(config.toObject());

    res.status(200).json({
      success: true,
      data: {
        schedule_type: config.schedule_type,
        day_of_month: config.day_of_month,
        custom_minutes: config.custom_minutes,
        last_updated: config.last_updated
      }
    });

  } catch (error) {
    console.error('Error updating salary config:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update salary configuration",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Initialize the cron job on server start
export const initSalaryCron = async () => {
  try {
    const config = await SalaryConfig.findOne().sort({ createdAt: -1 }) || {
      schedule_type: 'monthly',
      day_of_month: 28,
      custom_minutes: 5
    };
    
    await restartCronJob(config);
    console.log('Salary cron job initialized');
  } catch (error) {
    console.error('Failed to initialize salary cron job:', error);
  }
};