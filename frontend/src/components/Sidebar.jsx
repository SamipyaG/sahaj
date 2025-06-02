import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaCalendarAlt,
  FaExchangeAlt,
  FaSignOutAlt,
  FaUserCog
} from 'react-icons/fa';
import { useAuth } from '../context/authContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <FaHome />,
      label: 'Dashboard',
      path: '/dashboard'
    },
    {
      key: 'leaves',
      icon: <FaCalendarAlt />,
      label: 'Leaves',
      path: '/leaves'
    },
    {
      key: 'leave-handover',
      icon: <FaExchangeAlt />,
      label: 'Role Handover',
      path: '/leave-handover'
    },
    {
      key: 'profile',
      icon: <FaUserCog />,
      label: 'Profile',
      path: '/profile'
    }
  ];

  return (
    <div className="bg-white h-screen w-64 shadow-lg">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-teal-600">Employee Portal</h1>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={`flex items-center px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors ${location.pathname === item.path ? 'bg-teal-50 text-teal-600 border-r-4 border-teal-600' : ''
              }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button
          onClick={logout}
          className="flex items-center px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors w-full"
        >
          <span className="mr-3"><FaSignOutAlt /></span>
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar; 