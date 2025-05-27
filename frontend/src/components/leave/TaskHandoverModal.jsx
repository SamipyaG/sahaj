import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import { toast } from 'react-toastify';

const TaskHandoverModal = ({ leaveId, onClose }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [tasks, setTasks] = useState([{ title: '', description: '', deadline: '', priority: 'Medium' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`/api/users/department/${user.department}`);
        setEmployees(response.data.filter(emp => emp._id !== user._id)); // Exclude current user
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to load employees');
      }
    };
    fetchEmployees();
  }, [user]);

  const handleAddTask = () => {
    if (tasks.length >= 10) {
      toast.warning('Maximum 10 tasks allowed');
      return;
    }
    setTasks([...tasks, { title: '', description: '', deadline: '', priority: 'Medium' }]);
  };

  const handleRemoveTask = (index) => {
    if (tasks.length <= 1) {
      toast.warning('At least one task is required');
      return;
    }
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (tasks.some(task => !task.title)) {
      toast.error('All tasks must have a title');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/handovers', {
        leaveId,
        toEmployee: selectedEmployee,
        tasks
      });
      toast.success('Task handover created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating handover:', error);
      toast.error(error.response?.data?.error || 'Failed to create task handover');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Task Handover</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Tasks</h3>
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Task
              </button>
            </div>

            {tasks.map((task, index) => (
              <div key={index} className="border p-4 rounded mb-4">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">Task {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={task.priority}
                      onChange={(e) => handleTaskChange(index, 'priority', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={task.description}
                      onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                      className="w-full p-2 border rounded"
                      rows="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={task.deadline}
                      onChange={(e) => handleTaskChange(index, 'deadline', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Handover'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskHandoverModal; 