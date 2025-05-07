import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/authContext";

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
      <div className="text-center">
        <h3 className="text-2xl font-bold">Manage Leaves</h3>
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

      <table className="w-full text-sm text-left text-gray-500 mt-6">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border border-gray-200">
          <tr>
            <th className="px-6 py-3">SNO</th>
            <th className="px-6 py-3">Leave Type</th>
            <th className="px-6 py-3">From</th>
            <th className="px-6 py-3">To</th>
            <th className="px-6 py-3">Days</th>
            <th className="px-6 py-3">Description</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredLeaves.map((leave) => (
            <tr
              key={leave._id}
              className="bg-white border-b light:bg-gray-800 light:border-gray-700"
            >
              <td className="px-6 py-3">{sno++}</td>
              <td className="px-6 py-3">{leave.leave_setup_id.leaveType}</td>
              <td className="px-6 py-3">
                {new Date(leave.startDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-3">
                {new Date(leave.endDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-3">
                {calculateDays(leave.startDate, leave.endDate)}
              </td>
              <td className="px-6 py-3">{leave.reason}</td>
              <td className="px-6 py-3">{leave.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default List;
