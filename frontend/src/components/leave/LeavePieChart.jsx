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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const endpoint = isAdmin
          ? 'http://localhost:5000/api/leave/stats'
          : `http://localhost:5000/api/leave/stats/employee/${user._id}`;

        console.log('Fetching stats from:', endpoint);
        console.log('Auth token:', localStorage.getItem('token'));

        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('Stats response:', response.data);
        if (response.data.success) {
          if (!Array.isArray(response.data.stats)) {
            console.error('Stats is not an array:', response.data.stats);
            setError('Invalid data format received from server');
            return;
          }
          setStats(response.data.stats);
        } else {
          console.error('Server returned error:', response.data.error);
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

    if (user?._id) {
      fetchStats();
    }
  }, [user, isAdmin]);

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