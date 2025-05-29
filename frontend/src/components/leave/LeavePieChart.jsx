import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../../context/authContext';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const LeavePieChart = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filterType, setFilterType] = useState('leaveType'); // 'leaveType', 'department', 'designation'

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        let endpoint;
        if (!isAdmin) {
          endpoint = `http://localhost:5000/api/leave/stats/employee/${user._id}`;
        } else {
          switch (filterType) {
            case 'department':
              endpoint = 'http://localhost:5000/api/leave/stats/department';
              break;
            case 'designation':
              endpoint = 'http://localhost:5000/api/leave/stats/designation';
              break;
            default:
              endpoint = 'http://localhost:5000/api/leave/stats';
          }
        }

        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          if (!Array.isArray(response.data.stats)) {
            setError('Invalid data format received from server');
            return;
          }
          setStats(response.data.stats);
        } else {
          setError(response.data.error || 'Failed to fetch leave statistics');
        }
      } catch (err) {
        console.error('Error fetching leave statistics:', err);
        setError(err.response?.data?.error || 'Failed to fetch leave statistics');
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchStats();
    }
  }, [user, isAdmin, filterType]);

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
        <p className="text-gray-500">No leave data available</p>
      </div>
    );
  }

  const getChartData = () => {
    let labels, data;
    switch (filterType) {
      case 'department':
        labels = stats.map(stat => stat.department);
        data = stats.map(stat => stat.count);
        break;
      case 'designation':
        labels = stats.map(stat => stat.designation);
        data = stats.map(stat => stat.count);
        break;
      default:
        labels = stats.map(stat => stat.leaveType);
        data = stats.map(stat => stat.count);
    }
    return { labels, data };
  };

  const { labels, data } = getChartData();

  const chartData = {
    labels,
    datasets: [
      {
        data,
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
        text: isAdmin
          ? `Leave Distribution by ${filterType === 'leaveType' ? 'Leave Type' : filterType === 'department' ? 'Department' : 'Designation'}`
          : 'Your Leave Distribution',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {isAdmin && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter By
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
          >
            <option value="leaveType">Leave Type</option>
            <option value="department">Department</option>
            <option value="designation">Designation</option>
          </select>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-[400px] flex items-center justify-center">
          <Pie data={chartData} options={chartOptions} />
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Leave Summary</h3>
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">
                {filterType === 'department'
                  ? stat.department
                  : filterType === 'designation'
                    ? stat.designation
                    : stat.leaveType}
              </span>
              <span className="text-teal-600 font-bold">{stat.count} leaves</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeavePieChart; 