// Create ResetPassword.jsx to update password using link with ID and token
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { userId, code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Log the params when component mounts
    console.log('Reset Password Params:', { userId, code });
  }, [userId, code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      console.log('Sending reset password request:', { userId, code, passwordLength: password.length });
      const response = await axios.post(`http://localhost:5000/api/reset-password`, {
        userId,
        code,
        password
      });

      console.log('Reset password response:', response.data);

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center h-screen justify-center 
      bg-gradient-to-b from-blue-600 from-50% to-orange-100 to-50% space-y-6">
      <h2 className="font-pacific text-4xl text-white font-bold">
        Sajilo Bida
      </h2>
      <div className="border shadow-lg rounded-lg p-8 w-96 bg-white transform transition-all hover:scale-105">
        <h2 className="text-3xl font-bold mb-6 text-blue-600">Reset Password</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && (
          <p className="text-green-500 text-sm mb-4">
            Password updated successfully! Redirecting to login...
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              New Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-300"
              disabled={success}
            >
              Update Password
            </button>
          </div>
          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 