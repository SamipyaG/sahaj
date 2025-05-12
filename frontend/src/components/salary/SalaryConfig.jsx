import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SalaryConfig = () => {
  const [config, setConfig] = useState({
    schedule_type: 'monthly',
    day_of_month: 28,
    custom_minutes: 5
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/salary-config`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      if (response.data.data) {
        setConfig(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch salary configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.put('http://localhost:5000/api/salary-config', config, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Salary configuration updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'day_of_month' || name === 'custom_minutes'
        ? parseInt(value)
        : value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Salary Configuration</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Schedule Type</label>
          <select
            name="schedule_type"
            value={config.schedule_type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="monthly">Monthly</option>
            <option value="custom">Custom Interval (for testing)</option>
          </select>
        </div>

        {config.schedule_type === 'monthly' ? (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Day of Month (1-28)</label>
            <input
              type="number"
              name="day_of_month"
              min="1"
              max="28"
              value={config.day_of_month}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Run Every (minutes)</label>
            <input
              type="number"
              name="custom_minutes"
              min="1"
              value={config.custom_minutes}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>

      <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-bold mb-2 text-yellow-800">Current Schedule:</h3>
        <p className="text-yellow-700">
          {config.schedule_type === 'monthly' ? (
            `Salaries will be processed on day ${config.day_of_month} of each month at 9:00 AM IST`
          ) : (
            `Salaries will be processed every ${config.custom_minutes} minutes (TEST MODE)`
          )}
        </p>
      </div>
    </div>
  );
};

export default SalaryConfig;