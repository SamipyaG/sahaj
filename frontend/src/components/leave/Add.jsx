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
    leaveType: "", // Added to match backend
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
  const [numOfDays, setNumOfDays] = useState(0); // Track calculated days

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
          description: leaveSetup.description || ""
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

  // Calculate days whenever dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const days = calculateDays(formData.startDate, formData.endDate);
      setNumOfDays(days);
    } else {
      setNumOfDays(0);
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
      leaveType: type?.type || "" // Set leaveType to match backend
    }));
  };

  // Handle other form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // For end date, ensure it's not before start date
    if (name === "endDate" && formData.startDate && value < formData.startDate) {
      setError("End date cannot be before start date");
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user corrects input
    if (error) setError("");
  };

  // Calculate days between dates (improved)
  const calculateDays = (startDate, endDate) => {
    try {
      const start = dayjs(startDate);
      const end = dayjs(endDate);

      if (end.isBefore(start)) {
        return 0;
      }

      return end.diff(start, 'day') + 1; // Inclusive of both dates
    } catch (error) {
      return 0;
    }
  };

  // Form validation
  const validateForm = () => {
    if (!formData.leave_setup_id) {
      setError("Please select a leave type");
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      setError("Please select both start and end dates");
      return false;
    }

    const start = dayjs(formData.startDate);
    const end = dayjs(formData.endDate);
    const today = dayjs().startOf('day');

    if (start.isBefore(today)) {
      setError("Start date cannot be in the past");
      return false;
    }
    if (end.isBefore(start)) {
      setError("End date cannot be before start date");
      return false;
    }
    if (!formData.reason.trim()) {
      setError("Please provide a reason for leave");
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
          numOfDays, // Send calculated days
          leaveType: selectedLeaveType.type // Ensure leaveType is sent
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

      {/* Warning for excess days */}
      {selectedLeaveType && numOfDays > 0 && numOfDays > selectedLeaveType.maxDays && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
          <p>You are requesting {numOfDays - selectedLeaveType.maxDays} days more than your allowed balance ({selectedLeaveType.maxDays} days) for {selectedLeaveType.type}. Salary deduction will apply for these excess days.</p>
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
                  {type.type} (max {type.maxDays} days)
                </option>
              ))}
            </select>
            {selectedLeaveType && selectedLeaveType.description && (
              <p className="mt-2 text-sm text-gray-500">
                {selectedLeaveType.description}
              </p>
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
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                required
                min={dayjs().format('YYYY-MM-DD')}
                disabled={isSubmitting}
              />
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
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                required
                min={formData.startDate || dayjs().format('YYYY-MM-DD')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Days Calculation */}
          {numOfDays > 0 && (
            <div className={`p-3 rounded-md ${selectedLeaveType && numOfDays > selectedLeaveType.maxDays
                ? 'bg-red-50 text-red-800'
                : 'bg-blue-50 text-blue-800'
              }`}>
              <p className="text-sm">
                Total Leave Days: <span className="font-bold">{numOfDays}</span>
                {selectedLeaveType && (
                  <span className="ml-2">
                    (Max allowed: {selectedLeaveType.maxDays} days)
                  </span>
                )}
              </p>
              {selectedLeaveType && numOfDays > selectedLeaveType.maxDays && (
                <p className="mt-1 text-sm font-medium">
                  You're requesting more days than allowed for this leave type
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Explain the purpose of your leave..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (selectedLeaveType && numOfDays > selectedLeaveType.maxDays)}
              className={`px-6 py-2 rounded-md text-white ${isSubmitting || (selectedLeaveType && numOfDays > selectedLeaveType.maxDays)
                  ? 'bg-teal-300 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700'
                }`}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block animate-spin mr-2">↻</span>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddLeave;