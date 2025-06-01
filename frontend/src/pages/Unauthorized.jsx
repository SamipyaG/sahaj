import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <div className="space-y-4">
          <Link
            to={user?.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard'}
            className="block w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              sessionStorage.removeItem('userRole');
              window.location.href = '/login';
            }}
            className="block w-full py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 