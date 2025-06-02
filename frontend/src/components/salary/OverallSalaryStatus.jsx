import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';

const OverallSalaryStatus = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/salary', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setSalaries(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching salaries:', err);
        setError(err.response?.data?.error || 'Failed to fetch salary data');
        setLoading(false);
      }
    };

    fetchSalaries();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Overall Salary Status</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 border-b text-left">Employee Name</th>
              <th className="px-6 py-3 border-b text-left">Type</th>
              <th className="px-6 py-3 border-b text-left">Basic Salary</th>
              <th className="px-6 py-3 border-b text-left">Allowances</th>
              <th className="px-6 py-3 border-b text-left">Tax</th>
              <th className="px-6 py-3 border-b text-left">Leave Deduction</th>
              <th className="px-6 py-3 border-b text-left">Net Salary</th>
              <th className="px-6 py-3 border-b text-left">Pay Date</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((salary) => (
              <tr key={salary._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{salary.employee_name}</td>
                <td className="px-6 py-4 border-b">{salary.salary_type}</td>
                <td className="px-6 py-4 border-b">₹{salary.basic_salary?.toLocaleString() || 0}</td>
                <td className="px-6 py-4 border-b">₹{salary.allowances?.toLocaleString() || 0}</td>
                <td className="px-6 py-4 border-b">₹{salary.tax?.toLocaleString() || 0}</td>
                <td className="px-6 py-4 border-b">₹{salary.leave_deduction?.toLocaleString() || 0}</td>
                <td className="px-6 py-4 border-b">₹{salary.net_salary?.toLocaleString() || 0}</td>
                <td className="px-6 py-4 border-b">
                  {new Date(salary.pay_date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OverallSalaryStatus;