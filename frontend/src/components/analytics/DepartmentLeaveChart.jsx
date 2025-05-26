import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const DepartmentLeaveChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching department leave data...');
        const response = await axios.get(`http://localhost:5000/api/leave/analytics/department/${year}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('API Response:', response.data);

        if (response.data.success) {
          const { departments, leaveTypes } = response.data.data;
          console.log('Departments:', departments);
          console.log('Leave Types:', leaveTypes);

          const chartData = departments.map((dept, index) => {
            const dataPoint = { department: dept };
            leaveTypes.forEach(type => {
              dataPoint[type.name] = type.counts[index];
            });
            return dataPoint;
          });

          console.log('Chart Data:', chartData);
          setData(chartData);
        } else {
          setError(response.data.error || 'Failed to fetch department leave data');
        }
      } catch (err) {
        console.error('Error fetching department leave data:', err);
        setError(err.response?.data?.error || 'Failed to fetch department leave data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
        <p>No department leave data available</p>
      </div>
    );
  }

  // Get unique leave types from the data
  const leaveTypes = Object.keys(data[0] || {}).filter(key => key !== 'department');

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Department-wise Leave Distribution</h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded p-2"
        >
          {[2023, 2024, 2025].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Legend />
            {leaveTypes.map((type, index) => (
              <Bar
                key={type}
                dataKey={type}
                name={type}
                fill={COLORS[index % COLORS.length]}
                stackId="a"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DepartmentLeaveChart; 