import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs"; // For better date handling

const AddLeave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for form data
  const [formData, setFormData] = useState({
    user_id: user._id,
    leave_setup_id: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: ""
  });

  // State for UI
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [numOfDays, setNumOfDays] = useState(0);
  const [dateValidationErrors, setDateValidationErrors] = useState({
    startDate: "",
    endDate: ""
  });

  // Fetch available leave types
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/leave-setup`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        const formattedLeaveTypes = response.data.leaveSetups.map((leaveSetup) => ({
          type: leaveSetup.leaveType,
          id: leaveSetup._id,
          maxDays: leaveSetup.maxDays,
          description: leaveSetup.description || "",
          deductSalary: leaveSetup.deductSalary,
          noRestrictions: leaveSetup.noRestrictions
        }));

        setLeaveTypes(formattedLeaveTypes);
        setError("");
      } catch (err) {
        console.error("Error fetching leave types:", err);
        setError(err.response?.data?.error || "Failed to load leave types");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  // Real-time validation for dates
  useEffect(() => {
    const today = dayjs().startOf('day');
    const start = formData.startDate ? dayjs(formData.startDate) : null;
    const end = formData.endDate ? dayjs(formData.endDate) : null;

    if (!start) {
      setDateValidationErrors(prev => ({ ...prev, startDate: "Please select a start date" }));
    } else if (start.isBefore(today)) {
      setDateValidationErrors(prev => ({ ...prev, startDate: "Start date cannot be in the past" }));
    } else {
      setDateValidationErrors(prev => ({ ...prev, startDate: "" }));
    }

    if (!end) {
      setDateValidationErrors(prev => ({ ...prev, endDate: "Please select an end date" }));
    } else if (start && end.isBefore(start)) {
      setDateValidationErrors(prev => ({ ...prev, endDate: "End date cannot be before start date" }));
    } else {
      setDateValidationErrors(prev => ({ ...prev, endDate: "" }));
    }

    // Calculate days when both dates are valid
    if (start && end && !end.isBefore(start)) {
      const days = end.diff(start, 'day') + 1;
      setNumOfDays(days);
    }
  }, [formData.startDate, formData.endDate]);

  // Handle leave type selection
  const handleLeaveTypeChange = (e) => {
    const selectedId = e.target.value;
    const type = leaveTypes.find(t => t.id === selectedId);
    setSelectedLeaveType(type);
    setFormData(prev => ({
      ...prev,
      leave_setup_id: selectedId,
      leaveType: type?.type || ""
    }));
  };

  // Handle other form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.leave_setup_id) {
      setError("Please select a leave type");
      return false;
    }
    if (!formData.reason.trim()) {
      setError("Please provide a reason for leave");
      return false;
    }
    if (selectedLeaveType && !selectedLeaveType.noRestrictions && numOfDays > selectedLeaveType.maxDays) {
      setError(`You are requesting ${numOfDays - selectedLeaveType.maxDays} days more than your allowed balance (${selectedLeaveType.maxDays} days)`);
      return false;
    }
    if (dateValidationErrors.startDate || dateValidationErrors.endDate) {
      return false;
    }
    setError("");
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/leave/add",
        {
          ...formData,
          numOfDays,
          leaveType: selectedLeaveType.type
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate("/employee-dashboard"), 1500);
      }
    } catch (err) {
      console.error("Leave submission error:", err);
      setError(err.response?.data?.error || "Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Leave Request</h1>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          Leave request submitted successfully! Redirecting...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
          <p className="text-gray-600">Loading leave options...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type *
            </label>
            <select
              name="leave_setup_id"
              value={formData.leave_setup_id}
              onChange={handleLeaveTypeChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              required
              disabled={isSubmitting}
            >
              <option value="">-- Select Leave Type --</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type} {type.noRestrictions ? '(Unrestricted)' : `(max ${type.maxDays} days)`}
                </option>
              ))}
            </select>
            {selectedLeaveType && (
              <div className="mt-2 space-y-1">
                {selectedLeaveType.description && (
                  <p className="text-sm text-gray-500">
                    {selectedLeaveType.description}
                  </p>
                )}
                {selectedLeaveType.noRestrictions && (
                  <p className="text-sm text-blue-600">
                    This leave type has no restrictions on the number of days.
                  </p>
                )}
                {selectedLeaveType.deductSalary && (
                  <p className="text-sm text-amber-600">
                    This leave type will result in salary deduction.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:ring-teal-500 focus:border-teal-500 ${dateValidationErrors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                required
                min={dayjs().format('YYYY-MM-DD')}
                disabled={isSubmitting}
              />
              {dateValidationErrors.startDate && (
                <p className="mt-1 text-sm text-red-600">{dateValidationErrors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:ring-teal-500 focus:border-teal-500 ${dateValidationErrors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                required
                min={formData.startDate || dayjs().format('YYYY-MM-DD')}
                disabled={isSubmitting}
              />
              {dateValidationErrors.endDate && (
                <p className="mt-1 text-sm text-red-600">{dateValidationErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* Number of Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Days
            </label>
            <input
              type="text"
              value={numOfDays}
              readOnly
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            />
            {selectedLeaveType && !selectedLeaveType.noRestrictions && (
              <p className="mt-1 text-sm text-gray-500">
                Available balance: {selectedLeaveType.maxDays} days
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Leave *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              required
              disabled={isSubmitting}
              placeholder="Please provide a detailed reason for your leave request"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700'
              }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AddLeave;