import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = token ? JSON.parse(atob(token.split('.')[1])).role : null;

  const navigationItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <HomeIcon className="h-6 w-6" />
    },
    {
      title: 'Employees',
      path: '/employees',
      icon: <UserGroupIcon className="h-6 w-6" />
    },
    {
      title: 'Leave Management',
      path: '/leave-management',
      icon: <CalendarIcon className="h-6 w-6" />
    },
    // Only show analytics for admin and HR roles
    ...(userRole && ['admin', 'hr'].includes(userRole) ? [{
      title: 'Leave Analytics',
      path: '/leave-analytics',
      icon: <ChartBarIcon className="h-6 w-6" />
    }] : []),
    {
      title: 'Attendance',
      path: '/attendance',
      icon: <ClockIcon className="h-6 w-6" />
    },
    {
      title: 'Payroll',
      path: '/payroll',
      icon: <CurrencyDollarIcon className="h-6 w-6" />
    },
    {
      title: 'Departments',
      path: '/departments',
      icon: <BuildingOfficeIcon className="h-6 w-6" />
    },
    {
      title: 'Leave Setup',
      path: '/leave-setup',
      icon: <DocumentDuplicateIcon className="h-6 w-6" />
    },
    {
      title: 'Salary Config',
      path: '/salary-config',
      icon: <DocumentTextIcon className="h-6 w-6" />
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: <ClipboardDocumentListIcon className="h-6 w-6" />
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <CogIcon className="h-6 w-6" />
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <div className="p-4">
        <h1 className="text-2xl font-bold">HRMS</h1>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${location.pathname === item.path
              ? 'bg-gray-900 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
          >
            {item.icon}
            <span className="ml-3">{item.title}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 