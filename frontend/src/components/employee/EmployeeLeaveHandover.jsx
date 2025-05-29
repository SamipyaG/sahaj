import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import { FaExchangeAlt, FaCheck, FaTimes } from 'react-icons/fa';

const EmployeeLeaveHandover = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [handovers, setHandovers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        console.log('Current user:', user); // Debug log for user data

        if (!user || !user._id) {
          throw new Error('No user data available');
        }

        // First get the current employee data using the user ID
        const employeeResponse = await axios.get(`http://localhost:5000/api/employee/${user._id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('Employee response:', employeeResponse.data); // Debug log for response

        if (employeeResponse.data.success) {
          const employeeData = employeeResponse.data.data;
          console.log('Employee data:', employeeData); // Debug log for employee data
          setCurrentEmployee(employeeData);

          // Only proceed with other API calls if we have valid employee data
          if (employeeData && employeeData._id) {
            await fetchHandovers();
            await fetchAllEmployees();
            await fetchEmployeeLeaves();
          } else {
            throw new Error('Invalid employee data received');
          }
        } else {
          throw new Error(employeeResponse.data.error || 'Failed to fetch employee data');
        }
      } catch (err) {
        console.error('Error initializing data:', err);
        console.error('Error details:', err.response?.data); // Debug log for error details
        setError(err.response?.data?.error || err.message || 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    if (user && user._id) {
      console.log('Initializing with user ID:', user._id); // Debug log for user ID
      initializeData();
    } else {
      console.log('No user ID available'); // Debug log for missing user ID
      setError('No user data available. Please log in again.');
      setLoading(false);
    }
  }, [user]);

  const fetchHandovers = async () => {
    try {
      console.log('Fetching handovers for user:', user); // Debug log
      console.log('Token:', localStorage.getItem('token')); // Debug log

      const response = await axios.get('http://localhost:5000/api/leave-handover/history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Handover response:', response.data); // Debug log

      if (response.data.success) {
        setHandovers(response.data.handovers || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch handover history');
      }
    } catch (err) {
      console.error('Error fetching handovers:', err);
      console.error('Error response:', err.response?.data); // Debug log
      setError(err.response?.data?.error || 'Failed to fetch handover history');
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employee', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Filter out the current user from the list
        const filteredEmployees = response.data.data.filter(
          emp => emp.user_id._id !== user._id
        );
        setEmployees(filteredEmployees);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees');
    }
  };

  const fetchEmployeeLeaves = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/leave/${user._id}/employee`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success && Array.isArray(response.data.leaves)) {
        // Filter only approved leaves
        const approvedLeaves = response.data.leaves.filter(
          leave => leave.status === 'Approved'
        );
        console.log('Approved leaves:', approvedLeaves); // Debug log
        setLeaves(approvedLeaves);
      } else {
        console.error('Invalid employee leave data received:', response.data);
        setError('Invalid employee leave data received');
      }
    } catch (err) {
      console.error('Error fetching employee leaves:', err);
      setError('Failed to fetch leaves');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!currentEmployee) {
        throw new Error('Employee data not found');
      }

      const data = {
        leave_id: selectedLeave,
        to_employee_id: selectedEmployee,
        handover_notes: handoverNotes
      };

      const response = await axios.post('http://localhost:5000/api/leave-handover', data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setShowForm(false);
        setSelectedLeave('');
        setSelectedEmployee('');
        setHandoverNotes('');
        setError(null);
        await fetchHandovers();
      }
    } catch (err) {
      console.error('Error creating handover:', err);
      setError(err.response?.data?.error || 'Failed to create handover');
    }
  };

  const handleStatusUpdate = async (handoverId, status) => {
    try {
      console.log('Updating handover status:', { handoverId, status }); // Debug log

      const response = await axios.put(
        `http://localhost:5000/api/leave-handover/${handoverId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('Status update response:', response.data); // Debug log

      if (response.data.success) {
        await fetchHandovers();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      console.error('Error details:', err.response?.data); // Debug log
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leave Handover</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Handover'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Leave
              </label>
              <select
                value={selectedLeave}
                onChange={(e) => setSelectedLeave(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a leave</option>
                {leaves.map(leave => (
                  <option key={leave._id} value={leave._id}>
                    {leave.leave_setup_id?.leaveType || 'Unknown Type'} ({new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select an employee</option>
                {employees.map(employee => (
                  <option key={employee._id} value={employee._id}>
                    {employee.user_id?.name || 'Unknown Employee'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Handover Notes
            </label>
            <textarea
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              className="w-full p-2 border rounded"
              rows="4"
              required
              placeholder="Enter handover details and responsibilities..."
            />
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="bg-teal-500 text-white px-6 py-2 rounded hover:bg-teal-600 transition-colors"
            >
              Create Handover
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Handover History</h2>
          {handovers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No handover records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {handovers.map((handover) => (
                    <tr key={handover._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {handover.from_employee_id?.user_id?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {handover.to_employee_id?.user_id?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {handover.leave_id ? (
                          <>
                            {new Date(handover.leave_id.startDate).toLocaleDateString()} - {new Date(handover.leave_id.endDate).toLocaleDateString()}
                          </>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${handover.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                          handover.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {handover.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {handover.handover_notes}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {handover.status === 'Pending' && !handover.is_admin_initiated && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(handover._id, 'Accepted')}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(handover._id, 'Rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveHandover; 