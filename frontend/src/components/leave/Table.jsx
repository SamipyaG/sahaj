import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { columns, LeaveButtons } from "../../utils/LeaveHelper";
import LeavePieChart from "./LeavePieChart";

const Table = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [error, setError] = useState(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:5000/api/leave", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        const leavesWithSno = response.data.leaves.map((leave, index) => ({
          ...leave,
          sno: index + 1,
          employee_id: leave.employee_id?.employee_id || "N/A",
          name: leave.employee_id?.user_id?.name || "N/A",
          leaveType: leave.leave_setup_id?.leaveType || "N/A",
          department: leave.employee_id?.department_id?.department_name || "N/A",
          days: leave.numOfDays || 0,
          action: <LeaveButtons Id={leave._id} />,
        }));
        setLeaves(leavesWithSno);
        setFilteredLeaves(leavesWithSno);
      } else {
        setError(response.data.error || "Failed to fetch leave data");
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
      setError(error.response?.data?.error || "Failed to fetch leave data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const filterLeaves = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = leaves.filter(
      (leave) =>
        leave.name.toLowerCase().includes(searchTerm) ||
        leave.department.toLowerCase().includes(searchTerm) ||
        leave.leaveType.toLowerCase().includes(searchTerm)
    );
    setFilteredLeaves(filtered);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-2xl font-bold text-blue-800">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-5">
        <div className="text-center text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchLeaves}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold">Manage Leaves</h3>
      </div>

      {/* Leave Distribution Charts */}
      <div className="mb-10 space-y-10">
        <div>
          <h4 className="text-center text-2xl font-bold text-blue-900 mb-6">Leave Type Distribution</h4>
          <LeavePieChart isAdmin={true} />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search By Name, Department, or Leave Type"
          className="px-4 py-1 border rounded-md"
          onChange={filterLeaves}
        />
        <Link
          to="/admin-dashboard/leave-setup"
          className="px-4 py-1 bg-teal-600 rounded text-white"
        >
          Manage Leave Types
        </Link>
      </div>
      <div className="mt-5">
        <DataTable
          columns={columns}
          data={filteredLeaves}
          pagination
          highlightOnHover
        />
      </div>
    </div>
  );
};

export default Table;
