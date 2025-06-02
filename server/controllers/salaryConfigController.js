import SalaryConfig from "../models/salaryConfig.js";
import cron from 'node-cron';
import { generateMonthlySalaries, generateWeeklySalaries } from './salaryController.js';

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
  if (!config || !config.schedule_type || !config.auto_generate) {
    console.log('Salary auto-generation is disabled or invalid configuration');
    return;
  }

  // Parse payment time
  const [hours, minutes] = config.payment_time.split(':').map(Number);

  // Schedule based on config type
  switch (config.schedule_type) {
    case 'monthly':
      activeCronJob = cron.schedule(
        `${minutes} ${hours} ${config.payment_day} * *`,
        () => {
          console.log('Running scheduled monthly salary generation');
          generateMonthlySalaries().catch(console.error);
        },
        {
          timezone: config.timezone,
          scheduled: true
        }
      );
      console.log(`Monthly salary processing scheduled for ${config.payment_day_name} at ${config.payment_time} ${config.timezone}`);
      break;

    case 'weekly':
      activeCronJob = cron.schedule(
        `${minutes} ${hours} * * ${config.payment_day}`,
        () => {
          console.log('Running scheduled weekly salary generation');
          generateWeeklySalaries().catch(console.error);
        },
        {
          timezone: config.timezone,
          scheduled: true
        }
      );
      console.log(`Weekly salary processing scheduled for ${config.payment_day_name} at ${config.payment_time} ${config.timezone}`);
      break;

    default:
      throw new Error('Invalid schedule type');
  }
};

/**
 * Validates configuration data
 * @param {Object} config - Configuration to validate
 * @returns {Array} - Array of error messages
 */
const validateConfig = (config) => {
  const errors = [];

  if (!['weekly', 'monthly'].includes(config.schedule_type)) {
    errors.push('Invalid schedule type. Must be either weekly or monthly');
  }

  if (config.schedule_type === 'monthly' &&
    (config.payment_day < 1 || config.payment_day > 28)) {
    errors.push('Monthly payment day must be between 1-28');
  }

  if (config.schedule_type === 'weekly' &&
    (config.payment_day < 0 || config.payment_day > 6)) {
    errors.push('Weekly payment day must be between 0-6 (Sunday-Saturday)');
  }

  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.payment_time)) {
    errors.push('Payment time must be in HH:mm format (24-hour)');
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
        payment_day: 28,
        payment_time: '09:00',
        timezone: 'Asia/Kolkata',
        auto_generate: true,
        notify_employees: true,
        notify_admin: true
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
      payment_day: config.payment_day,
      payment_day_name: config.payment_day_name,
      payment_time: config.payment_time,
      timezone: config.timezone,
      auto_generate: config.auto_generate,
      notify_employees: config.notify_employees,
      notify_admin: config.notify_admin,
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
      payment_day: config.payment_day,
      payment_day_name: config.payment_day_name,
      payment_time: config.payment_time,
      timezone: config.timezone,
      auto_generate: config.auto_generate,
      notify_employees: config.notify_employees,
      notify_admin: config.notify_admin,
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
        payment_day: 28,
        payment_time: '09:00',
        timezone: 'Asia/Kolkata',
        auto_generate: true,
        notify_employees: true,
        notify_admin: true
      });
    }

    await restartCronJob(config);
    console.log('Salary cron job initialized successfully');

  } catch (error) {
    console.error('Failed to initialize salary cron:', error);

    // Fallback to safe defaults
    await restartCronJob({
      schedule_type: 'monthly',
      payment_day: 28,
      payment_time: '09:00',
      timezone: 'Asia/Kolkata',
      auto_generate: true
    });
  }
};