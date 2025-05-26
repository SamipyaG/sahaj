import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const LeaveBalanceOverview = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/employees', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data.success) {
          setEmployees(response.data.employees);
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/leave/analytics/balance/${year}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: {
            employeeId: selectedEmployee !== 'all' ? selectedEmployee : undefined
          }
        });

        console.log('API Response:', response.data); // Debug log

        if (response.data.success) {
          // Transform the data for the pie chart
          const { leaveTypes } = response.data.data;
          console.log('Leave Types:', leaveTypes); // Debug log

          if (!leaveTypes || !Array.isArray(leaveTypes)) {
            console.error('Invalid leave types data:', leaveTypes);
            setError('Invalid data format received from server');
            return;
          }

          const chartData = leaveTypes.map(type => ({
            name: type.leaveType || 'Unknown',
            value: type.remainingDays || 0
          }));

          console.log('Chart Data:', chartData); // Debug log
          setData(chartData);
        } else {
          setError(response.data.error || 'Failed to fetch leave balance data');
        }
      } catch (err) {
        console.error('Error fetching leave balance:', err);
        setError(err.response?.data?.error || 'Failed to fetch leave balance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEmployee, year]);

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
        <p>No leave balance data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Leave Balance Overview</h2>
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
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="border rounded p-2"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.employee_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} days`, 'Remaining']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></div>
            <div>
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-gray-500">
                {item.value} days remaining
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveBalanceOverview; 