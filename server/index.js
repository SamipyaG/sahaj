import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import authRouter from './routes/auth.js';
import departmentRouter from './routes/department.js';
import employeeRouter from './routes/employee.js';
import salaryRouter from './routes/salary.js';
import salaryConfig from './routes/salaryConfig.js';
import leaveRouter from './routes/leave.js';
import settingRouter from './routes/setting.js';
import dashboardRouter from './routes/dashboard.js';
import designationRouter from './routes/designation.js';
import leavesetupRouter from './routes/leavesetup.js';
import leaveHandoverRoutes from './routes/leaveHandover.js';
import connectToDatabase from './db/db.js';
import { initSalaryCron } from './controllers/salaryConfigController.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Enhanced security
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
  credentials: true
}));

app.use(express.json());
app.use(express.static('public/uploads'));

// Forgot Password API Endpoint
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot Password Request for email:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ msg: 'User does not exist' });
    }

    // Generate a 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated reset code:', resetCode);

    // Set expiry to 1 hour from now
    const resetCodeExpiry = new Date(Date.now() + 3600000);
    console.log('Reset code expiry:', resetCodeExpiry);

    // Save the code and expiry to user
    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;
    await user.save();
    console.log('Reset code saved for user:', user._id);

    // In a real app, you would send this code via SMS or another secure channel
    // For development, we'll return it in the response
    res.json({
      success: true,
      msg: 'Reset code generated successfully',
      // Remove this in production
      resetCode: resetCode,
      userId: user._id
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({
      success: false,
      msg: 'Error generating reset code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reset Password API Endpoint
app.post('/api/reset-password', async (req, res) => {
  try {
    const { userId, code, password } = req.body;
    console.log('Reset Password Request:', { userId, code, passwordLength: password?.length });

    // Find user and verify code
    const user = await User.findOne({
      _id: userId,
      resetCode: code,
      resetCodeExpiry: { $gt: Date.now() }
    });

    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('Reset code match:', user.resetCode === code);
      console.log('Code expiry:', user.resetCodeExpiry);
      console.log('Current time:', new Date());
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid or expired reset code'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset code
    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpiry = null;
    console.log('Attempting to save user after password reset:', user._id);
    await user.save();
    console.log('User saved successfully after password reset:', user._id);

    res.json({
      success: true,
      msg: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({
      success: false,
      msg: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/department', departmentRouter);
app.use('/api/employee', employeeRouter);
app.use('/api/salary', salaryRouter);
app.use('/api/salary-config', salaryConfig);
app.use('/api/leave', leaveRouter);
app.use('/api/leave-setup', leavesetupRouter);
app.use('/api/setting', settingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/designation', designationRouter);
app.use('/api/leave-handover', leaveHandoverRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    await connectToDatabase();
    console.log('Database connected successfully');

    await initSalaryCron();

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

startServer();