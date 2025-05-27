import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import { toast } from 'react-toastify';

const TaskHandoverList = ({ leaveId }) => {
  const { user } = useAuth();
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [responseComment, setResponseComment] = useState('');

  useEffect(() => {
    fetchHandovers();
  }, [leaveId]);

  const fetchHandovers = async () => {
    try {
      const response = await axios.get(`/api/handovers/leave/${leaveId}`);
      setHandovers(response.data.data);
    } catch (error) {
      console.error('Error fetching handovers:', error);
      toast.error('Failed to load handovers');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (handoverId, status) => {
    try {
      await axios.put(`/api/handovers/${handoverId}/respond`, {
        status,
        comment: responseComment
      });
      toast.success(`Handover ${status.toLowerCase()} successfully`);
      setSelectedHandover(null);
      setResponseComment('');
      fetchHandovers();
    } catch (error) {
      console.error('Error responding to handover:', error);
      toast.error(error.response?.data?.error || 'Failed to respond to handover');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (handovers.length === 0) {
    return <div className="text-center py-4 text-gray-500">No task handovers found</div>;
  }

  return (
    <div className="space-y-4">
      {handovers.map((handover) => (
        <div key={handover._id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium">
                From: {handover.fromEmployee.name}
              </h3>
              <p className="text-sm text-gray-600">
                To: {handover.toEmployee.name}
              </p>
              <p className="text-sm text-gray-600">
                Status: <span className={`font-medium ${handover.handoverStatus === 'Pending' ? 'text-yellow-600' :
                    handover.handoverStatus === 'Accepted' ? 'text-green-600' :
                      'text-red-600'
                  }`}>
                  {handover.handoverStatus}
                </span>
              </p>
            </div>
            {handover.handoverStatus === 'Pending' &&
              handover.toEmployee._id === user._id && (
                <div className="space-x-2">
                  <button
                    onClick={() => setSelectedHandover(handover)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Respond
                  </button>
                </div>
              )}
          </div>

          <div className="space-y-2">
            {handover.tasks.map((task, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${task.priority === 'High' ? 'bg-red-100 text-red-800' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                    {task.priority}
                  </span>
                </div>
                {task.deadline && (
                  <p className="text-sm text-gray-500 mt-1">
                    Deadline: {new Date(task.deadline).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          {handover.responseComment && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm">
                <span className="font-medium">Response: </span>
                {handover.responseComment}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(handover.responseDate).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Response Modal */}
      {selectedHandover && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Respond to Handover</h3>
            <textarea
              value={responseComment}
              onChange={(e) => setResponseComment(e.target.value)}
              placeholder="Add a comment (optional)"
              className="w-full p-2 border rounded mb-4"
              rows="3"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setSelectedHandover(null);
                  setResponseComment('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespond(selectedHandover._id, 'Rejected')}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reject
              </button>
              <button
                onClick={() => handleRespond(selectedHandover._id, 'Accepted')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskHandoverList; 