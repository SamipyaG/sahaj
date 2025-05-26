import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';

const OverallSalaryStatus = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salaryStatus, setSalaryStatus] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [generating, setGenerating] = useState(false);

  const fetchSalaryStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/salary/paidStatus', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Salary status response:', response.data);
      setSalaryStatus(response.data.data);
    } catch (err) {
      console.error('Error fetching salary status:', err);
      setError(err.response?.data?.error || 'Failed to fetch salary status');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSalaries = async () => {
    try {
      setGenerating(true);
      const response = await axios.post('http://localhost:5000/api/salary/test-generate', {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Salary generation response:', response.data);
      if (response.data.success) {
        // Refresh the salary status after generation
        await fetchSalaryStatus();
      }
    } catch (err) {
      console.error('Error generating salaries:', err);
      setError(err.response?.data?.error || 'Failed to generate salaries');
    } finally {
      setGenerating(false);
    }
  };

  const handleMonthClick = async (month) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/salary/monthly/${month.year}/${month.monthNum}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Monthly details response:', response.data);
      setSelectedMonth(response.data.data);
    } catch (err) {
      console.error('Error fetching monthly details:', err);
      setError(err.response?.data?.error || 'Failed to fetch monthly salary details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-red-700 hover:text-red-900"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Salary Payment Status</h2>
        <button
          onClick={handleGenerateSalaries}
          disabled={generating}
          className={`px-4 py-2 rounded-md text-white ${generating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {generating ? (
            <span className="flex items-center">
              <FaSpinner className="animate-spin mr-2" />
              Generating...
            </span>
          ) : (
            'Generate Salaries'
          )}
        </button>
      </div>

      {/* Monthly Status Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.N.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salaryStatus.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.month}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.paidCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleMonthClick(item)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Monthly Details Modal */}
      {selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                Salary Details - {selectedMonth.month} {selectedMonth.year}
              </h3>
              <button
                onClick={() => setSelectedMonth(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.N.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {console.log('selectedMonth data in modal:', selectedMonth)}
                  {console.log('Salaries array in modal:', selectedMonth?.salaries)}
                  {selectedMonth?.salaries?.map((salary, index) => (
                    <tr key={salary._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {salary.employee_id?.user_id?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {salary.employee_id?.department_id?.department_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {salary.designation_id?.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(salary.designation_id?.basic_salary || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -₹{(salary.tax || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        +₹{(salary.allowances || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -₹{(salary.deductions || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{(
                          (salary.designation_id?.basic_salary || 0) +
                          (salary.allowances || 0) -
                          (salary.tax || 0) -
                          (salary.deductions || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallSalaryStatus;