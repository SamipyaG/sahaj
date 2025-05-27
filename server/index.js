import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import leaveAnalyticsRouter from './routes/leaveAnalytics.js';
import taskHandoverRoutes from './routes/taskHandover.js';
import connectToDatabase from './db/db.js';
import { initSalaryCron } from './controllers/salaryConfigController.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/department', departmentRouter);
app.use('/api/employee', employeeRouter);
app.use('/api/salary', salaryRouter);
app.use('/api/salary-config', salaryConfig);
app.use('/api/leave', leaveRouter);
app.use('/api/setting', settingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/designation', designationRouter);
app.use('/api/leave-setup', leavesetupRouter);
app.use('/api/leave-analytics', leaveAnalyticsRouter);
app.use('/api/handovers', taskHandoverRoutes);

// Connect to database
connectToDatabase();

// Initialize salary cron job
initSalaryCron();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});