import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('http://localhost:5000/api/employee', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        console.log('Full API response:', response);

        const employeeData = response?.data?.data;

        if (!Array.isArray(employeeData)) {
          throw new Error('Employee data is not an array');
        }

        setEmployees(employeeData);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load employees');
        setEmployees([]); // Ensure it's always an array
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading employees...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <h3 className="font-bold">Error Loading Employees</h3>
        <p>{error}</p>
        <p className="text-sm mt-2">Check browser console for more details</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Employee List</h2>

      {Array.isArray(employees) && employees.length === 0 ? (
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          No employees found in the system
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(employees) &&
                employees.map((employee) => {
                  const empName = employee.employee_name || 'Unknown';
                  const empId = employee.employee_id || 'N/A';
                  const department =
                    employee.department_name ||
                    employee.department_id?.department_name ||
                    'N/A';
                  const email =
                    employee.user?.email ||
                    employee.user_id?.email ||
                    'N/A';
                  const profileImage =
                    employee.user?.profileImage ||
                    employee.user_id?.profileImage ||
                    'default.png';

                  return (
                    <tr key={employee._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-full mr-3"
                            src={`http://localhost:5000/${profileImage}`}
                            alt={empName}
                            onError={(e) => {
                              e.target.src = '/default-profile.png';
                            }}
                          />
                          <div>
                            <div className="font-medium">{empName}</div>
                            <div className="text-sm text-gray-500">{empId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{department}</td>
                      <td className="px-4 py-3">{email}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/employees/${employee._id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
