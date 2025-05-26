import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import LeaveSetup from '../models/LeaveSetup.js';

// Get department-wise leave usage
export const getDepartmentLeaveUsage = async (req, res) => {
  try {
    const { year } = req.params;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const departments = await Department.find();
    const leaveTypes = await LeaveSetup.find();

    const departmentData = await Promise.all(
      departments.map(async (dept) => {
        const employees = await Employee.find({ department: dept._id });
        const employeeIds = employees.map(emp => emp._id);

        const leaveCounts = await Promise.all(
          leaveTypes.map(async (type) => {
            const count = await Leave.countDocuments({
              employee: { $in: employeeIds },
              leaveType: type._id,
              startDate: { $gte: startDate },
              endDate: { $lte: endDate },
              status: 'approved'
            });
            return {
              name: type.leaveType,
              count
            };
          })
        );

        return {
          department: dept.department_name,
          leaveTypes: leaveCounts
        };
      })
    );

    res.json({
      success: true,
      data: {
        departments: departmentData.map(d => d.department),
        leaveTypes: leaveTypes.map(type => ({
          name: type.leaveType,
          counts: departmentData.map(d =>
            d.leaveTypes.find(lt => lt.name === type.leaveType)?.count || 0
          )
        }))
      }
    });
  } catch (error) {
    console.error('Error in getDepartmentLeaveUsage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department leave usage'
    });
  }
};

// Get monthly leave trends
export const getMonthlyLeaveTrends = async (req, res) => {
  try {
    const { year } = req.params;
    const { department } = req.query;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    let employeeIds = [];
    if (department && department !== 'all') {
      const employees = await Employee.find({ department });
      employeeIds = employees.map(emp => emp._id);
    }

    const leaveTypes = await LeaveSetup.find();
    const monthlyData = await Promise.all(
      leaveTypes.map(async (type) => {
        const monthlyCounts = await Promise.all(
          Array.from({ length: 12 }, async (_, month) => {
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);

            const query = {
              leaveType: type._id,
              startDate: { $gte: monthStart },
              endDate: { $lte: monthEnd },
              status: 'approved'
            };

            if (employeeIds.length > 0) {
              query.employee = { $in: employeeIds };
            }

            const count = await Leave.countDocuments(query);
            return count;
          })
        );

        return {
          name: type.leaveType,
          monthlyCounts
        };
      })
    );

    res.json({
      success: true,
      data: {
        leaveTypes: monthlyData
      }
    });
  } catch (error) {
    console.error('Error in getMonthlyLeaveTrends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly leave trends'
    });
  }
};

// Get top leave takers
export const getTopLeaveTakers = async (req, res) => {
  try {
    const { year } = req.params;
    const { leaveType } = req.query;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const query = {
      startDate: { $gte: startDate },
      endDate: { $lte: endDate },
      status: 'approved'
    };

    if (leaveType && leaveType !== 'all') {
      query.leaveType = leaveType;
    }

    const leaveData = await Leave.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'employeeData.department',
          foreignField: '_id',
          as: 'departmentData'
        }
      },
      {
        $lookup: {
          from: 'leavesetups',
          localField: 'leaveType',
          foreignField: '_id',
          as: 'leaveTypeData'
        }
      },
      {
        $group: {
          _id: '$employee',
          total_days: { $sum: '$totalDays' },
          employee_name: { $first: { $concat: ['$employeeData.firstName', ' ', '$employeeData.lastName'] } },
          department_name: { $first: '$departmentData.department_name' },
          leave_type: { $first: '$leaveTypeData.leaveType' }
        }
      },
      { $sort: { total_days: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: leaveData
    });
  } catch (error) {
    console.error('Error in getTopLeaveTakers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top leave takers'
    });
  }
};

// Get leave balance overview
export const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    const leaveTypes = await LeaveSetup.find();
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const balanceData = await Promise.all(
      leaveTypes.map(async (type) => {
        const usedLeaves = await Leave.aggregate([
          {
            $match: {
              employee: employee._id,
              leaveType: type._id,
              startDate: { $gte: startDate },
              endDate: { $lte: endDate },
              status: 'approved'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalDays' }
            }
          }
        ]);

        const used = usedLeaves[0]?.total || 0;
        const remaining = type.totalDays - used;

        return {
          leaveType: type.leaveType,
          total: type.totalDays,
          used,
          remaining
        };
      })
    );

    res.json({
      success: true,
      data: balanceData
    });
  } catch (error) {
    console.error('Error in getLeaveBalance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leave balance'
    });
  }
};

// Get team availability
export const getTeamAvailability = async (req, res) => {
  try {
    const { department } = req.query;
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let employees = [];
    if (department && department !== 'all') {
      employees = await Employee.find({ department });
    } else {
      employees = await Employee.find();
    }

    const employeeIds = employees.map(emp => emp._id);
    const leaves = await Leave.find({
      employee: { $in: employeeIds },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: 'approved'
    });

    const availabilityData = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayLeaves = leaves.filter(leave =>
        d >= leave.startDate && d <= leave.endDate
      );
      const onLeaveCount = dayLeaves.length;
      const availableCount = employeeIds.length - onLeaveCount;

      availabilityData[dateStr] = {
        total: employeeIds.length,
        available: availableCount,
        onLeave: onLeaveCount
      };
    }

    res.json({
      success: true,
      data: availabilityData
    });
  } catch (error) {
    console.error('Error in getTeamAvailability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team availability'
    });
  }
}; 