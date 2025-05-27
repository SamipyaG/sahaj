import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import { toast } from 'react-toastify';
import TaskHandoverModal from './TaskHandoverModal';
import TaskHandoverList from './TaskHandoverList';

const LeaveApplicationForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leaveId, setLeaveId] = useState(null);
  const [showTaskHandoverModal, setShowTaskHandoverModal] = useState(false);
  const [showTaskHandoverList, setShowTaskHandoverList] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/leave', {
        // Add your leave application data here
      });
      setLeaveId(response.data.data._id);
      toast.success('Leave application submitted successfully');
    } catch (error) {
      console.error('Error submitting leave:', error);
      toast.error(error.response?.data?.error || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Leave Application</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={() => setShowTaskHandoverModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Task Handover
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowTaskHandoverList(true)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            View Task Handovers
          </button>
        </div>
      </form>

      {showTaskHandoverModal && (
        <TaskHandoverModal
          leaveId={leaveId}
          onClose={() => setShowTaskHandoverModal(false)}
        />
      )}

      {showTaskHandoverList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium">Task Handovers</h3>
              <button
                onClick={() => setShowTaskHandoverList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <TaskHandoverList leaveId={leaveId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApplicationForm; 