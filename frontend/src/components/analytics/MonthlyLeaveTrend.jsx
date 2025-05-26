import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MonthlyLeaveTrend = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/leave/analytics/monthly/${year}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: {
            department: selectedDepartment !== 'all' ? selectedDepartment : undefined
          }
        });

        if (response.data.success) {
          // Transform the data for the chart
          const { leaveTypes } = response.data.data;
          const chartData = MONTHS.map((month, monthIndex) => {
            const dataPoint = { month };
            leaveTypes.forEach(type => {
              dataPoint[type.name] = type.monthlyCounts[monthIndex];
            });
            return dataPoint;
          });
          setData(chartData);
        } else {
          setError(response.data.error || 'Failed to fetch monthly leave trends');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch monthly leave trends');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDepartment, year]);

  // Fetch departments for the filter
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/departments', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data.success) {
          setDepartments(response.data.departments);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };

    fetchDepartments();
  }, []);

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

  // Get unique leave types from the data
  const leaveTypes = Object.keys(data[0] || {}).filter(key => key !== 'month');

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Monthly Leave Trends</h2>
        <div className="flex gap-4">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded p-2"
          >
            {[2023, 2024, 2025].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border rounded p-2"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {leaveTypes.map((type, index) => (
              <Line
                key={type}
                type="monotone"
                dataKey={type}
                name={type}
                stroke={COLORS[index % COLORS.length]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyLeaveTrend; 