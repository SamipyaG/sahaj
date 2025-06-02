import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import { FaExchangeAlt, FaCheck, FaTimes } from 'react-icons/fa';

const LeaveHandover = ({ isAdmin = false }) => {
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
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await fetchHandovers();
        if (isAdmin) {
          await fetchAllEmployees();
          await fetchAllLeaves();
        } else {
          await fetchEmployeeLeaves();
        }
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [isAdmin]);

  // Real-time validation when leave or employee selection changes
  useEffect(() => {
    const validateSelection = async () => {
      if (!selectedLeave || !selectedEmployee) return;

      try {
        const response = await axios.post(
          'http://localhost:5000/api/leave-handover/validate',
          {
            leave_id: selectedLeave,
            to_employee_id: selectedEmployee
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        setValidationErrors(response.data.errors || {});
      } catch (err) {
        console.error('Validation error:', err);
        setValidationErrors({
          general: err.response?.data?.error || 'Failed to validate selection'
        });
      }
    };

    validateSelection();
  }, [selectedLeave, selectedEmployee]);

  const fetchHandovers = async () => {
    try {
      const endpoint = isAdmin
        ? 'http://localhost:5000/api/leave-handover/admin/all'
        : 'http://localhost:5000/api/leave-handover/history';

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Log the handover data for debugging
        console.log('Handover data:', response.data.handovers);
        // Log the first handover's structure if available
        if (response.data.handovers && response.data.handovers.length > 0) {
          const firstHandover = response.data.handovers[0];
          console.log('First handover structure:', {
            from: {
              employee: firstHandover.from_employee_id,
              user: firstHandover.from_employee_id?.user_id
            },
            to: {
              employee: firstHandover.to_employee_id,
              user: firstHandover.to_employee_id?.user_id
            }
          });
        }
        setHandovers(response.data.handovers || []);
      } else {
        throw new Error('Failed to fetch handover history');
      }
    } catch (err) {
      console.error('Error fetching handovers:', err);
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

      // Log the response for debugging
      console.log('Employee API Response:', response.data);

      // Check if response.data exists and has the expected structure
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      // The backend returns data in response.data.data
      const employeeData = response.data.data;

      if (!Array.isArray(employeeData)) {
        throw new Error('Employee data is not in the expected format');
      }

      // Filter out the current user from the list
      const filteredEmployees = employeeData.filter(
        emp => emp.user_id._id !== user._id
      );

      setEmployees(filteredEmployees);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.message || 'Failed to fetch employees');
      setEmployees([]); // Reset employees array on error
    }
  };

  const fetchAllLeaves = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/leave', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success && Array.isArray(response.data.leaves)) {
        // Filter only approved leaves
        const approvedLeaves = response.data.leaves.filter(
          leave => leave.status === 'Approved'
        );
        setLeaves(approvedLeaves);
      } else {
        console.error('Invalid leave data received:', response.data);
        setError('Invalid leave data received');
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError('Failed to fetch leaves');
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
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = isAdmin ? 'http://localhost:5000/api/leave-handover/admin' : 'http://localhost:5000/api/leave-handover';

      const selectedLeaveData = leaves.find(l => l._id === selectedLeave);
      if (!selectedLeaveData) {
        setError('Selected leave not found');
        return;
      }

      const data = isAdmin ? {
        leave_id: selectedLeave,
        from_employee_id: selectedLeaveData.employee_id,
        to_employee_id: selectedEmployee,
        handover_notes: handoverNotes,
        is_admin_initiated: true
      } : {
        leave_id: selectedLeave,
        to_employee_id: selectedEmployee,
        handover_notes: handoverNotes,
        is_admin_initiated: false
      };

      console.log('Submitting handover data:', data); // Debug log

      const response = await axios.post(endpoint, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setShowForm(false);
        setSelectedLeave('');
        setSelectedEmployee('');
        setHandoverNotes('');
        setValidationErrors({});
        await fetchHandovers();
      }
    } catch (err) {
      console.error('Error creating handover:', err);
      setError(err.response?.data?.error || 'Failed to create handover');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (handoverId, status) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/leave-handover/${handoverId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        await fetchHandovers();
      }
    } catch (err) {
      console.error('Error updating status:', err);
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
        <h1 className="text-2xl font-bold text-gray-800">
          {isAdmin ? 'Leave Handover Management' : 'Leave Handover'}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Leave Handover'}
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
              {validationErrors.leave && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.leave}</p>
              )}
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
              {validationErrors.employee && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.employee}</p>
              )}
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

          {validationErrors.general && (
            <div className="mb-4 text-red-500 text-sm">
              {validationErrors.general}
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(validationErrors).length > 0}
              className={`bg-teal-500 text-white px-6 py-2 rounded hover:bg-teal-600 transition-colors ${(isSubmitting || Object.keys(validationErrors).length > 0) && 'opacity-50 cursor-not-allowed'
                }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Handover'}
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
                    {!isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
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
                      {!isAdmin && handover.status === 'Pending' && !handover.is_admin_initiated && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        </td>
                      )}
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

export default LeaveHandover;
