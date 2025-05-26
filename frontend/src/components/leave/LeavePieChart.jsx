import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { useAuth } from '../../context/authContext';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const LeavePieChart = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [departmentsRes, leaveTypesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/departments', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }),
          axios.get('http://localhost:5000/api/leave-setup', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

        if (departmentsRes.data.success) {
          setDepartments(departmentsRes.data.departments);
        }
        if (leaveTypesRes.data.success) {
          setLeaveTypes(leaveTypesRes.data.leaveSetups);
        }

      } catch (err) {
        console.error('Error fetching filter data:', err);
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (year) params.year = year;
        if (selectedDepartment !== 'all') params.departmentId = selectedDepartment;
        if (selectedLeaveType !== 'all') params.leaveTypeId = selectedLeaveType;

        // If not admin, fetch only employee's stats (if userId is available)
        const endpoint = isAdmin ?
          'http://localhost:5000/api/leave/stats' :
          (user?._id ? `http://localhost:5000/api/leave/stats/employee/${user._id}` : null);

        if (!endpoint) {
          setLoading(false);
          return;
        }

        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          params: isAdmin ? params : {} // Only send filters for admin view
        });

        if (response.data.success) {
          setStats(response.data.stats);
        } else {
          setError(response.data.error || 'Failed to fetch leave statistics');
        }
      } catch (err) {
        console.error('Error fetching leave statistics:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.response?.data?.error || 'Failed to fetch leave statistics');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin || user?._id) {
      fetchStats();
    }
  }, [user, isAdmin, year, selectedDepartment, selectedLeaveType]); // Add filters to dependency array

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p className="font-medium">Error loading leave statistics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No leave data available for the selected filters.</p>
      </div>
    );
  }

  console.log('Rendering chart with stats:', stats);

  const chartData = {
    labels: stats.map(stat => stat.leaveType),
    datasets: [
      {
        data: stats.map(stat => stat.count),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: isAdmin ? 'Overall Leave Distribution' : 'Your Leave Distribution',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-semibold">Leave Type Distribution</h4> {/* Adjusted heading */}
        <div className="flex gap-4">
          {/* Year Filter */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded p-2 text-sm"
          >
            {[2023, 2024, 2025].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {/* Department Filter (Admin only) */}
          {isAdmin && (
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border rounded p-2 text-sm"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          )}
          {/* Leave Type Filter (Admin only) */}
          {isAdmin && (
            <select
              value={selectedLeaveType}
              onChange={(e) => setSelectedLeaveType(e.target.value)}
              className="border rounded p-2 text-sm"
            >
              <option value="all">All Leave Types</option>
              {leaveTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.leaveType}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-[400px] flex items-center justify-center">
          <Pie data={chartData} options={chartOptions} />
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Leave Summary</h3>
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">{stat.leaveType}</span>
              <span className="text-teal-600 font-bold">{stat.count} leaves</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeavePieChart; 