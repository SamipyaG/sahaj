import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaBuilding,
  FaCalendarAlt,
  FaCogs,
  FaMoneyBillWave,
  FaTachometerAlt,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../context/authContext";

const Sidebar = () => {
    const {user} = useAuth()
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
          to="/employee-dashboard"
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
          to={`/employee-dashboard/profile/${user._id}`}
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaUsers className="text-xl" />
          <span className="font-medium">My Profile</span>
        </NavLink>

        <NavLink
          to={`/employee-dashboard/leaves/${user._id}`}
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaBuilding className="text-xl" />
          <span className="font-medium">Leaves</span>
        </NavLink>

        <NavLink
          to={`/employee-dashboard/salary/${user._id}`}
          className={({ isActive }) =>
            `${
              isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-blue-700"
            } flex items-center space-x-4 block py-3 px-4 rounded-lg mt-2 transition-all duration-300`
          }
        >
          <FaCalendarAlt className="text-xl" />
          <span className="font-medium">Salary</span>
        </NavLink>

        <NavLink
          to="/employee-dashboard/setting"
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

export default Sidebar;