import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/authContext";
import LeavePieChart from "./LeavePieChart";

const List = () => {
  const [leaves, setLeaves] = useState(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState("All");
  const { id } = useParams();
  const { user } = useAuth();

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const fetchLeaves = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/leave/${id}/${user.role}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setLeaves(response.data.leaves);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      if (error.response && !error.response.data.success) {
        alert(error.message);
      }
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  if (!leaves) {
    return <div>Loading...</div>;
  }

  const uniqueLeaveTypes = [...new Set(leaves.map(leave => leave.leave_setup_id.leaveType))];

  const filteredLeaves =
    selectedLeaveType === "All"
      ? leaves
      : leaves.filter(leave => leave.leave_setup_id.leaveType === selectedLeaveType);

  let sno = 1;

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold">Manage Leaves</h3>
      </div>

      {/* Leave Statistics Chart */}
      <div className="mb-8">
        <LeavePieChart isAdmin={user.role === 'admin'} />
      </div>

      <div className="flex justify-between items-center mt-4">
        <input
          type="text"
          placeholder="Search By Dep Name"
          className="px-4 py-0.5 border"
        />
        {user.role === "employee" && (
          <Link
            to="/employee-dashboard/add-leave"
            className="px-4 py-1 bg-teal-600 rounded text-white"
          >
            Add New Leave
          </Link>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mt-4">
        <button
          className={`px-3 py-1 rounded ${selectedLeaveType === "All" ? "bg-teal-600 text-white" : "bg-gray-200"}`}
          onClick={() => setSelectedLeaveType("All")}
        >
          All
        </button>
        {uniqueLeaveTypes.map((type) => (
          <button
            key={type}
            className={`px-3 py-1 rounded ${selectedLeaveType === type ? "bg-teal-600 text-white" : "bg-gray-200"}`}
            onClick={() => setSelectedLeaveType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Leave Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">S.No</th>
              <th className="px-4 py-2 border">Employee ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Leave Type</th>
              <th className="px-4 py-2 border">Department</th>
              <th className="px-4 py-2 border">Days</th>
              <th className="px-4 py-2 border">Status</th>
              {user.role === 'admin' && <th className="px-4 py-2 border">Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map((leave) => (
              <tr key={leave._id}>
                <td className="px-4 py-2 border text-center">{sno++}</td>
                <td className="px-4 py-2 border text-center">{leave.employee_id?.employee_id || "N/A"}</td>
                <td className="px-4 py-2 border text-center">{leave.employee_id?.user_id?.name || "N/A"}</td>
                <td className="px-4 py-2 border text-center">{leave.leave_setup_id?.leaveType || "N/A"}</td>
                <td className="px-4 py-2 border text-center">{leave.employee_id?.department_id?.department_name || "N/A"}</td>
                <td className="px-4 py-2 border text-center">{leave.numOfDays || calculateDays(leave.startDate, leave.endDate)}</td>
                <td className="px-4 py-2 border text-center">
                  <span className={`px-2 py-1 rounded ${leave.status === "Approved" ? "bg-green-100 text-green-800" :
                    leave.status === "Rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                    {leave.status}
                  </span>
                </td>
                {user.role === 'admin' && (
                  <td className="px-4 py-2 border text-center">
                    <Link
                      to={`/admin-dashboard/leaves/${leave._id}`}
                      className="px-4 py-1 bg-teal-500 rounded text-white hover:bg-teal-600"
                    >
                      View
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default List;
