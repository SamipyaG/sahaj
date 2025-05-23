import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const EmployeeLeaveChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('http://localhost:5000/api/leave/stats/overall', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          // Process the data to combine leave types
          const processedStats = response.data.stats.map(stat => {
            const leaveTypeCounts = stat.leaveTypes.reduce((acc, lt) => {
              acc[lt.leaveType] = (acc[lt.leaveType] || 0) + lt.days;
              return acc;
            }, {});
            return {
              ...stat,
              leaveTypeCounts
            };
          });
          setStats(processedStats);
        } else {
          setError(response.data.error || 'Failed to fetch employee leave statistics');
        }
      } catch (err) {
        console.error('Error fetching employee leave statistics:', err);
        setError(err.response?.data?.error || 'Failed to fetch employee leave statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
        <p className="font-medium">Error loading employee leave statistics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No employee leave data available</p>
      </div>
    );
  }

  const chartData = {
    labels: stats.map(stat => stat.employeeName),
    datasets: [
      {
        label: 'Total Approved Leaves',
        data: stats.map(stat => stat.totalLeaves),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Employee Leave Distribution',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Leaves'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Employee Name'
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="h-[400px]">
        <Bar data={chartData} options={chartOptions} />
      </div>
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Employee Leave Summary</h3>
        <div className="space-y-2">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">{stat.employeeName}</span>
              <div className="text-right">
                <span className="text-teal-600 font-bold">{stat.totalLeaves} leaves</span>
                <div className="text-sm text-gray-600">
                  {Object.entries(stat.leaveTypeCounts).map(([type, days], i) => (
                    <span key={i} className="mr-2">
                      {type}: {days} days
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveChart; 