import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { FaInfoCircle } from 'react-icons/fa';

const OverallSalaryStatus = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salaryStatus, setSalaryStatus] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const fetchSalaryStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/salary/paidStatus', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSalaryStatus(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch salary status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStatus();
  }, []);

  const columns = [
    {
      name: 'S.N.',
      selector: row => row.sn,
      width: '80px',
      center: true,
    },
    {
      name: 'Year',
      selector: row => row.year,
      center: true,
    },
    {
      name: 'Month',
      selector: row => row.month,
      center: true,
    },
    {
      name: 'Status',
      cell: row => (
        <div className={`px-3 py-1 rounded-full text-sm ${
          row.status === 'Processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status}
        </div>
      ),
      center: true,
    },
    {
      name: 'Employees Paid',
      cell: row => (
        <button 
          onClick={() => setSelectedMonth(row)}
          className="flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
        >
          {row.paidCount} <FaInfoCircle className="ml-1" />
        </button>
      ),
      center: true,
    }
  ];

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p>Loading salary status...</p>
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
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Salary Payment Status</h2>
      
      <DataTable
        columns={columns}
        data={salaryStatus}
        pagination
        highlightOnHover
        striped
        responsive
        noDataComponent="No salary records found"
        className="border rounded-lg overflow-hidden"
      />

      {selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedMonth.month} {selectedMonth.year}
              </h3>
              <button 
                onClick={() => setSelectedMonth(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <p className="mb-2">{selectedMonth.paidCount} employees paid:</p>
              <ul className="list-disc pl-5">
                {selectedMonth.employees.map((emp, idx) => (
                  <li key={idx} className="mb-1">
                    {emp.name} ({emp.employeeId})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallSalaryStatus;