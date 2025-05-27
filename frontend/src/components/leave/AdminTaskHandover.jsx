import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import { toast } from 'react-toastify';

const AdminTaskHandover = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedFromEmployee, setSelectedFromEmployee] = useState('');
  const [selectedToEmployee, setSelectedToEmployee] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState('');
  const [tasks, setTasks] = useState([{ title: '', description: '', deadline: '', priority: 'Medium' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchEmployees();
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedFromEmployee) {
      fetchLeaves();
    }
  }, [selectedFromEmployee]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`/api/users/department/${selectedDepartment}`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await axios.get(`/api/leaves/employee/${selectedFromEmployee}`);
      setLeaves(response.data.filter(leave => leave.status === 'Approved'));
    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast.error('Failed to load leaves');
    }
  };

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

    if (!selectedFromEmployee || !selectedToEmployee || !selectedLeave) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (tasks.some(task => !task.title)) {
      toast.error('All tasks must have a title');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/handovers/admin', {
        leaveId: selectedLeave,
        fromEmployee: selectedFromEmployee,
        toEmployee: selectedToEmployee,
        tasks
      });
      toast.success('Task handover created successfully');
      // Reset form
      setSelectedFromEmployee('');
      setSelectedToEmployee('');
      setSelectedLeave('');
      setTasks([{ title: '', description: '', deadline: '', priority: 'Medium' }]);
    } catch (error) {
      console.error('Error creating handover:', error);
      toast.error(error.response?.data?.error || 'Failed to create task handover');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Admin Task Handover</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Employee
            </label>
            <select
              value={selectedFromEmployee}
              onChange={(e) => setSelectedFromEmployee(e.target.value)}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Employee
            </label>
            <select
              value={selectedToEmployee}
              onChange={(e) => setSelectedToEmployee(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Employee</option>
              {employees
                .filter(emp => emp._id !== selectedFromEmployee)
                .map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Period
            </label>
            <select
              value={selectedLeave}
              onChange={(e) => setSelectedLeave(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Leave Period</option>
              {leaves.map(leave => (
                <option key={leave._id} value={leave._id}>
                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
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

        <div className="flex justify-end">
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
  );
};

export default AdminTaskHandover; 