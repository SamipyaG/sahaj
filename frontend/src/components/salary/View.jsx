import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const EmployeeSalaryView = () => {
  const { id } = useParams();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/salary/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('API Response:', response.data); // Debug log
      if (response.data.success) {
        setSalaries(response.data.data.docs || []);
      } else {
        setError(response.data.error || 'Failed to fetch salary records');
      }
    } catch (err) {
      console.error('Error fetching salaries:', err); // Debug log
      setError(err.response?.data?.error || 'Failed to fetch salary records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p>Loading salary data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-5">
      <h2 className="text-2xl font-bold mb-4">Salary History</h2>

      {salaries.length === 0 ? (
        <div className="text-center p-5">No salary records found</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">S.N.</th>
              <th className="py-2 px-4 border">Salary ID</th>
              <th className="py-2 px-4 border">Basic Salary</th>
              <th className="py-2 px-4 border">Allowances</th>
              <th className="py-2 px-4 border">Deductions</th>
              <th className="py-2 px-4 border">Tax</th>
              <th className="py-2 px-4 border">Net Salary</th>
              <th className="py-2 px-4 border">Pay Date</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((salary, index) => {
              // Calculate net salary
              const basicSalary = salary.designation_id?.basic_salary || 0;
              const allowances = salary.allowances || 0;
              const deductions = salary.deductions || 0;
              const tax = salary.tax || 0;
              const netSalary = basicSalary + allowances - deductions - tax;

              return (
                <tr key={salary._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border text-center">{index + 1}</td>
                  <td className="py-2 px-4 border text-center">{salary.salary_id}</td>
                  <td className="py-2 px-4 border text-right">₹{basicSalary.toFixed(2)}</td>
                  <td className="py-2 px-4 border text-right text-green-500">+₹{allowances.toFixed(2)}</td>
                  <td className="py-2 px-4 border text-right text-red-500">-₹{deductions.toFixed(2)}</td>
                  <td className="py-2 px-4 border text-right text-red-500">-₹{tax.toFixed(2)}</td>
                  <td className="py-2 px-4 border text-right font-medium text-green-600">
                    ₹{netSalary.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {new Date(salary.pay_date).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmployeeSalaryView;