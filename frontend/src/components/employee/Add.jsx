import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';

const AddEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [formData, setFormData] = useState({
    employee_name: '',
    email: '',
    password: '',
    confirm_password: '',
    department_id: '',
    designation_id: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    role: 'employee'
  });

  const [errors, setErrors] = useState({
    employee_name: '',
    email: '',
    password: '',
    confirm_password: '',
    department_id: '',
    designation_id: '',
    date_of_birth: '',
    gender: '',
    marital_status: ''
  });

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/department', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data.success) {
          setDepartments(response.data.data);
        }
      } catch (error) {
        toast.error('Failed to fetch departments');
        console.error('Department fetch error:', error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch designations when department changes
  useEffect(() => {
    const fetchDesignations = async () => {
      if (!formData.department_id) {
        setDesignations([]);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/designation/department/${formData.department_id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data.success) {
          setDesignations(response.data.data);
        }
      } catch (error) {
        toast.error('Failed to fetch designations');
        console.error('Designation fetch error:', error);
      }
    };
    fetchDesignations();
  }, [formData.department_id]);

  // Real-time validation functions
  const validateName = (name) => {
    if (!name.trim()) return 'Name is required';
    if (name.length < 2) return 'Name must be at least 2 characters long';
    if (name.length > 50) return 'Name must not exceed 50 characters';
    if (!name.includes(' ')) return 'Please enter both first and last name';
    return '';
  };

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const validateDateOfBirth = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 21) return 'Employee must be at least 21 years old';
    if (age > 60) return 'Employee cannot be older than 60 years';
    return '';
  };

  // Handle input changes with real-time validation
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData(prev => ({ ...prev, [name]: value }));

    // Immediate validation
    let errorMessage = '';
    switch (name) {
      case 'employee_name':
        errorMessage = validateName(value);
        break;
      case 'email':
        errorMessage = validateEmail(value);
        break;
      case 'password':
        errorMessage = validatePassword(value);
        // Also validate confirm password if it exists
        if (formData.confirm_password) {
          setErrors(prev => ({
            ...prev,
            confirm_password: validateConfirmPassword(value, formData.confirm_password)
          }));
        }
        break;
      case 'confirm_password':
        errorMessage = validateConfirmPassword(formData.password, value);
        break;
      case 'department_id':
        errorMessage = !value ? 'Department is required' : '';
        break;
      case 'designation_id':
        errorMessage = !value ? 'Designation is required' : '';
        break;
      case 'date_of_birth':
        errorMessage = validateDateOfBirth(value);
        break;
      case 'gender':
        errorMessage = !value ? 'Gender is required' : '';
        break;
      case 'marital_status':
        errorMessage = !value ? 'Marital status is required' : '';
        break;
    }

    // Update errors state immediately
    setErrors(prev => ({ ...prev, [name]: errorMessage }));
  };

  // Validate all fields
  const validateAllFields = () => {
    const newErrors = {
      employee_name: validateName(formData.employee_name),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirm_password: validateConfirmPassword(formData.password, formData.confirm_password),
      department_id: !formData.department_id ? 'Department is required' : '',
      designation_id: !formData.designation_id ? 'Designation is required' : '',
      date_of_birth: validateDateOfBirth(formData.date_of_birth),
      gender: !formData.gender ? 'Gender is required' : '',
      marital_status: !formData.marital_status ? 'Marital status is required' : ''
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate all fields before submission
    if (!validateAllFields()) {
      toast.error('Please fix the errors before submitting');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/employee', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        toast.success('Employee added successfully');
        navigate('/admin-dashboard/employees');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(error.response?.data?.error || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Add New Employee</h2>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the employee details below
            </p>
          </div>
          <button
            onClick={() => navigate('/admin-dashboard/employees')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ← Back to Employees
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {/* Employee Name */}
              <div>
                <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="employee_name"
                    id="employee_name"
                    value={formData.employee_name}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.employee_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.employee_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.employee_name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="confirm_password"
                    id="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                  )}
                </div>
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <div className="mt-1">
                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.department_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                  {errors.department_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>
                  )}
                </div>
              </div>

              {/* Designation */}
              <div>
                <label htmlFor="designation_id" className="block text-sm font-medium text-gray-700">
                  Designation
                </label>
                <div className="mt-1">
                  <select
                    id="designation_id"
                    name="designation_id"
                    value={formData.designation_id}
                    onChange={handleChange}
                    disabled={!formData.department_id}
                    className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.designation_id ? 'border-red-300' : 'border-gray-300'
                      } ${!formData.department_id ? 'bg-gray-100' : ''}`}
                  >
                    <option value="">Select Designation</option>
                    {designations.map((desig) => (
                      <option key={desig._id} value={desig._id}>
                        {desig.title}
                      </option>
                    ))}
                  </select>
                  {errors.designation_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.designation_id}</p>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="date_of_birth"
                    id="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <div className="mt-1">
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.gender ? 'border-red-300' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>
              </div>

              {/* Marital Status */}
              <div>
                <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700">
                  Marital Status
                </label>
                <div className="mt-1">
                  <select
                    id="marital_status"
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.marital_status ? 'border-red-300' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                  {errors.marital_status && (
                    <p className="mt-1 text-sm text-red-600">{errors.marital_status}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin-dashboard/employees')}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Adding...
                  </>
                ) : (
                  'Add Employee'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee; 