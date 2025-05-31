// Create a new file: ForgotPassword.jsx
// This component will take user email input and call API to send reset link

import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resetCode, setResetCode] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      console.log('Sending forgot password request for email:', email);
      const response = await axios.post('http://localhost:5000/api/forgot-password', { email });
      console.log('Forgot password response:', response.data);

      if (response.data.success) {
        setSuccess(true);
        setResetCode(response.data.resetCode);
        setUserId(response.data.userId);
      }
    } catch (err) {
      console.error('Error sending reset code:', err);
      if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else {
        setError('Failed to generate reset code. Please try again.');
      }
    }
  };

  const handleResetClick = () => {
    if (userId && resetCode) {
      navigate(`/reset-password/${userId}/${resetCode}`);
    }
  };

  return (
    <div className="flex flex-col items-center h-screen justify-center 
      bg-gradient-to-b from-blue-600 from-50% to-orange-100 to-50% space-y-6">
      <h2 className="font-pacific text-4xl text-white font-bold">
        Sajilo Bida
      </h2>
      <div className="border shadow-lg rounded-lg p-8 w-96 bg-white transform transition-all hover:scale-105">
        <h2 className="text-3xl font-bold mb-6 text-blue-600">Forgot Password</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && (
          <div className="mb-4">
            <p className="text-green-500 text-sm mb-2">
              Reset code generated successfully!
            </p>
            <p className="text-gray-700 text-sm mb-4">
              Your reset code is: <span className="font-bold">{resetCode}</span>
            </p>
            <button
              onClick={handleResetClick}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 mb-4"
            >
              Click here to reset your password
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-300"
              disabled={success}
            >
              Generate Reset Code
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

export default ForgotPassword; 