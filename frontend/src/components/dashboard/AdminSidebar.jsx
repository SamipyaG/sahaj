import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaBuilding,
  FaCalendarCheck,
  FaCogs,
  FaMoneyCheckAlt,
  FaTachometerAlt,
  FaUsers,
  FaUserTie,
  FaUserCog,
  FaClipboardList,
  FaWallet,
} from "react-icons/fa";

const AdminSidebar = () => {
  return (
    <div className="bg-gray-800 text-white h-screen fixed left-0 top-0 bottom-0 space-y-2 w-64 shadow-xl">
      {/* Header */}
      <div className="bg-blue-600 h-16 flex items-center justify-center">
        <h3 className="text-2xl text-center font-pacific text-white">
          Sajilo Bida
        </h3>
      </div>

      {/* Navigation Links */}
      <div className="px-4 py-6">
        <NavLink
          to="/admin-dashboard"
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg transition-all duration-300`
          }
          end
        >
          <FaTachometerAlt className="text-xl" />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin-dashboard/employees"
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaUsers className="text-xl" />
          <span className="font-medium">Employee</span>
        </NavLink>

        <NavLink
          to="/admin-dashboard/departments"
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaBuilding className="text-xl" />
          <span className="font-medium">Department</span>
        </NavLink>

        <NavLink
          to="/admin-dashboard/leaves"
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaCalendarCheck className="text-xl" />
          <span className="font-medium">Leave</span>
        </NavLink>

        <NavLink
          to="/admin-dashboard/salary/add"
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaMoneyCheckAlt className="text-xl" />
          <span className="font-medium">Salary Pay</span>
        </NavLink>

        <NavLink
          to="/admin-dashboard/salary/automatic"
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaWallet className="text-xl" />
          <span className="font-medium">Automatic Salary Slip</span>
        </NavLink>

        <NavLink
          to="/admin-dashboard/designation"
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaUserTie className="text-xl" />
          <span className="font-medium">Designation</span>
        </NavLink>

        <NavLink
          to="/admin-dashboard/leave-Setup"
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaClipboardList className="text-xl" />
          <span className="font-medium">Leave Setup</span>
        </NavLink>

        <NavLink
          to="/admin-dashboard/setting"
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaCogs className="text-xl" />
          <span className="font-medium">Settings</span>
        </NavLink>
      </div>
    </div>
  );
};

export default AdminSidebar;
