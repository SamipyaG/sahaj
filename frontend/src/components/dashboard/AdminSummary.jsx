import React, { useEffect, useState } from "react";
import SummaryCard from "./SummaryCard";
import {
  FaBuilding,
  FaCheckCircle,
  FaFileAlt,
  FaHourglassHalf,
  FaIdCard,
  FaTimesCircle,
  FaUsers,
  FaCalendarAlt,
  FaCalendarCheck,
  FaClock,
  FaCalendarTimes,
  FaUserTie,
  FaSitemap
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminSummary = () => {
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const summary = await axios.get(`http://localhost:5000/api/dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        console.log(summary.data);
        setSummary(summary.data);
      } catch (error) {
        if (error.response) {
          alert(error.response.data.error);
        }
        console.log(error.message);
      }
    };
    fetchSummary();
  }, []);

  if (!summary) {
    return <div className="flex items-center justify-center h-screen text-2xl font-bold text-blue-800">Loading...</div>;
  }

  return (
    <div className="p-8 bg-gradient-to-r from-gray-100 to-gray-200 min-h-screen">
      <h3 className="text-4xl font-bold text-blue-900 text-center mb-10">Dashboard Overview</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          onClick={() => navigate('/admin-dashboard/employees')}
          className="cursor-pointer transform transition-transform hover:scale-105"
        >
          <SummaryCard
            icon={<FaUserTie className="text-5xl text-white" />}
            text="Total Employees"
            number={summary.totalEmployees}
            color="bg-blue-700 hover:bg-blue-800 shadow-lg"
          />
        </div>
        <div
          onClick={() => navigate('/admin-dashboard/departments')}
          className="cursor-pointer transform transition-transform hover:scale-105"
        >
          <SummaryCard
            icon={<FaSitemap className="text-5xl text-white" />}
            text="Total Departments"
            number={summary.totalDepartments}
            color="bg-orange-600 hover:bg-orange-700 shadow-lg"
          />
        </div>
        <div
          onClick={() => navigate('/admin-dashboard/designation')}
          className="cursor-pointer transform transition-transform hover:scale-105"
        >
          <SummaryCard
            icon={<FaIdCard className="text-5xl text-white" />}
            text="Total Designations"
            number={summary.totalDesignations}
            color="bg-purple-600 hover:bg-purple-700 shadow-lg"
          />
        </div>
      </div>

      <div className="mt-14">
        <h4 className="text-center text-3xl font-bold text-blue-900 mb-10">Leave Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            onClick={() => navigate('/admin-dashboard/leaves')}
            className="cursor-pointer transform transition-transform hover:scale-105"
          >
            <SummaryCard
              icon={<FaCalendarAlt className="text-5xl text-white" />}
              text="Leave Applied"
              number={summary.leaveSummary.appliedFor}
              color="bg-blue-700 hover:bg-blue-800 shadow-lg"
            />
          </div>
          <div
            onClick={() => navigate('/admin-dashboard/leaves')}
            className="cursor-pointer transform transition-transform hover:scale-105"
          >
            <SummaryCard
              icon={<FaCalendarCheck className="text-5xl text-white" />}
              text="Leave Approved"
              number={summary.leaveSummary.approved}
              color="bg-green-600 hover:bg-green-700 shadow-lg"
            />
          </div>
          <div
            onClick={() => navigate('/admin-dashboard/leaves')}
            className="cursor-pointer transform transition-transform hover:scale-105"
          >
            <SummaryCard
              icon={<FaClock className="text-5xl text-white" />}
              text="Leave Pending"
              number={summary.leaveSummary.pending}
              color="bg-yellow-600 hover:bg-yellow-700 shadow-lg"
            />
          </div>
          <div
            onClick={() => navigate('/admin-dashboard/leaves')}
            className="cursor-pointer transform transition-transform hover:scale-105"
          >
            <SummaryCard
              icon={<FaCalendarTimes className="text-5xl text-white" />}
              text="Leave Rejected"
              number={summary.leaveSummary.rejected}
              color="bg-red-600 hover:bg-red-700 shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSummary;
