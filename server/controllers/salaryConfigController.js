import SalaryConfig from "../models/salaryConfig.js";
import cron from 'node-cron';
import { generateMonthlySalaries } from './salaryController.js';

// Track active cron job to prevent duplicates
let activeCronJob = null;

/**
 * Restarts the cron job with new configuration
 * @param {Object} config - Configuration object
 */
const restartCronJob = async (config) => {
  // Clear existing cron job if any
  if (activeCronJob) {
    activeCronJob.stop();
    activeCronJob = null;
  }

  // Validate config
  if (!config || !config.schedule_type) {
    throw new Error('Invalid configuration provided');
  }

  // Schedule based on config type
  if (config.schedule_type === 'monthly') {
    activeCronJob = cron.schedule(
      `0 9 ${config.day_of_month} * *`, 
      () => {
        console.log('Running scheduled salary generation');
        generateMonthlySalaries().catch(console.error);
      },
      {
        timezone: "Asia/Kolkata",
        scheduled: true
      }
    );
    console.log(`Salary processing scheduled for day ${config.day_of_month} at 9 AM IST`);
  } else {
    activeCronJob = cron.schedule(
      `*/${config.custom_minutes} * * * *`,
      () => {
        console.log('Running test-mode salary generation');
        generateMonthlySalaries().catch(console.error);
      },
      {
        timezone: "Asia/Kolkata",
        scheduled: true
      }
    );
    console.log(`Salary processing every ${config.custom_minutes} minutes (TEST MODE)`);
  }
};

/**
 * Validates configuration data
 * @param {Object} config - Configuration to validate
 * @returns {Array} - Array of error messages
 */
const validateConfig = (config) => {
  const errors = [];
  
  if (!['monthly', 'custom'].includes(config.schedule_type)) {
    errors.push('Invalid schedule type');
  }

  if (config.schedule_type === 'monthly' && 
      (config.day_of_month < 1 || config.day_of_month > 28)) {
    errors.push('Day of month must be between 1-28');
  }

  if (config.schedule_type === 'custom' && 
      (config.custom_minutes < 1 || config.custom_minutes > 1440)) {
    errors.push('Custom interval must be 1-1440 minutes');
  }

  return errors;
};

/**
 * Gets current salary configuration
 */
export const getSalaryConfig = async (req, res) => {
  try {
    let config = await SalaryConfig.findOne().sort({ createdAt: -1 }).lean();

    // Return defaults if no config exists
    if (!config) {
      const defaultConfig = {
        schedule_type: 'monthly',
        day_of_month: 28,
        custom_minutes: 5
      };

      // Create and save default config
      config = await SalaryConfig.create({
        ...defaultConfig,
        updated_by: req.user._id
      });

      // Initialize cron with defaults
      await restartCronJob(defaultConfig);
    }

    // Prepare response data
    const responseData = {
      schedule_type: config.schedule_type,
      day_of_month: config.day_of_month,
      custom_minutes: config.custom_minutes,
      last_updated: config.updatedAt
    };

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

/**
 * Updates salary configuration
 */
export const updateSalaryConfig = async (req, res) => {
  try {
    // Validate input
    const validationErrors = validateConfig(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors
      });
    }

    // Prepare update
    const updateData = {
      ...req.body,
      updated_by: req.user._id,
      updatedAt: new Date()
    };

    // Update or create config
    const config = await SalaryConfig.findOneAndUpdate(
      {},
      updateData,
      { 
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        lean: true 
      }
    );

    // Restart cron with new config
    await restartCronJob(config);

    // Prepare response
    const responseData = {
      schedule_type: config.schedule_type,
      day_of_month: config.day_of_month,
      custom_minutes: config.custom_minutes,
      last_updated: config.updatedAt
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error updating salary config:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update configuration",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Initializes cron job on server start
 */
export const initSalaryCron = async () => {
  try {
    let config = await SalaryConfig.findOne().lean();

    if (!config) {
      // Create default config if none exists
      config = await SalaryConfig.create({
        schedule_type: 'monthly',
        day_of_month: 28,
        custom_minutes: 5
      });
    }

    await restartCronJob(config);
    console.log('Salary cron job initialized successfully');

  } catch (error) {
    console.error('Failed to initialize salary cron:', error);
    
    // Fallback to safe defaults
    await restartCronJob({
      schedule_type: 'monthly',
      day_of_month: 28
    });
  }
};