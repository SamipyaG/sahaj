import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const TeamAvailabilityHeatmap = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/leave/analytics/availability/${year}/${month + 1}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: {
            department: selectedDepartment !== 'all' ? selectedDepartment : undefined
          }
        });

        if (response.data.success) {
          // Transform the data for the calendar
          const availabilityData = {};
          response.data.data.forEach(item => {
            const date = new Date(item.date);
            const dateStr = date.toISOString().split('T')[0];
            availabilityData[dateStr] = {
              available: item.available,
              onLeave: item.onLeave,
              total: item.total
            };
          });
          setData(availabilityData);
        } else {
          setError(response.data.error || 'Failed to fetch team availability data');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch team availability data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDepartment, year, month]);

  const tileClassName = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = data[dateStr];

    if (!dayData) return '';

    const availabilityRatio = dayData.available / dayData.total;
    if (availabilityRatio >= 0.8) return 'bg-green-100';
    if (availabilityRatio >= 0.6) return 'bg-yellow-100';
    if (availabilityRatio >= 0.4) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const tileContent = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = data[dateStr];

    if (!dayData) return null;

    return (
      <div className="text-xs text-center mt-1">
        <div>{dayData.available}/{dayData.total}</div>
        <div className="text-gray-500">{dayData.onLeave} on leave</div>
      </div>
    );
  };

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

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Team Availability Heatmap</h2>
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
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border rounded p-2"
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((m, i) => (
              <option key={i} value={i}>{m}</option>
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
      <div className="flex justify-center">
        <Calendar
          value={new Date(year, month)}
          tileClassName={tileClassName}
          tileContent={tileContent}
          className="w-full max-w-3xl"
        />
      </div>
      <div className="mt-4 flex justify-center gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
          <span className="text-sm">80-100% Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
          <span className="text-sm">60-79% Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-100 rounded mr-2"></div>
          <span className="text-sm">40-59% Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
          <span className="text-sm">Below 40% Available</span>
        </div>
      </div>
    </div>
  );
};

export default TeamAvailabilityHeatmap; 