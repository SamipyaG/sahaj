import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';

const EmployeeList = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`http://localhost:5000/api/employee/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setEmployee(response.data.data);
        console.log(response.data.data)
      } catch (err) {
        console.error('Error fetching employee:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return <div className="text-center p-4">Loading employee data...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <h3 className="font-bold">Error Loading Employee</h3>
        <p>{error}</p>
        <p className="text-sm mt-2">Check browser console for more details</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center p-4 bg-yellow-50 rounded-lg">
        No employee found with this ID
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Employee Details</h2>
      
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 p-6 flex justify-center">
            <img
              className="h-48 w-48 rounded-full object-cover"
              src={`http://localhost:5000/${employee.user?.profileImage || employee.user_id?.profileImage}`}
              alt={employee.employee_name}
              onError={(e) => {
                e.target.src = '/default-profile.png';
              }}
            />
          </div>
          <div className="md:w-2/3 p-6">
            <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">
              {employee.department_name || employee.department_id?.department_name || 'N/A'}
            </div>
            <h1 className="text-2xl font-bold mt-1">{employee.employee_name}</h1>
            <p className="mt-2 text-gray-600">
              <span className="font-semibold">Employee ID:</span> {employee.employee_id}
            </p>
            <p className="mt-1 text-gray-600">
              <span className="font-semibold">Designation:</span> {employee.designation_name || employee.designation_id?.title || 'N/A'}
            </p>
            <p className="mt-1 text-gray-600">
              <span className="font-semibold">Email:</span> {employee.user?.email || employee.user_id?.email || 'N/A'}
            </p>
            <p className="mt-1 text-gray-600">
              <span className="font-semibold">Basic Salary:</span> {employee.basic_salary || employee.designation_id?.basic_salary || 'N/A'}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold">Date of Birth:</span> {new Date(employee.date_of_birth).toLocaleDateString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Gender:</span> {employee.gender}
                </p>
              </div>
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold">Marital Status:</span> {employee.marital_status}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Join Date:</span> {new Date(employee.join_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <Link
                to="/"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;