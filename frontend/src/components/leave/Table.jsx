import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { columns, LeaveButtons } from "../../utils/LeaveHelper";
import axios from "axios";

const Table = () => {
  const [leaves, setLeaves] = useState(null);
  const [filteredLeaves, setFilteredLeaves] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedLeaveType, setSelectedLeaveType] = useState("All");

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/leave", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          let sno = 1;
          const data = response.data.leaves.map((leave) => ({
            _id: leave._id,
            sno: sno++,
            employee_id: leave.employee_id?.employee_id || "N/A",
            name: leave.employee_id?.user_id?.name || "N/A",
            leaveType: leave.leave_setup_id?.leaveType || "N/A",
            department: leave.employee_id?.department_id?.department_name || "N/A",
            days: leave.numOfDays || calculateDays(leave.startDate, leave.endDate),
            status: leave.status,
            action: <LeaveButtons Id={leave._id} />,
            startDate: leave.startDate,
            endDate: leave.endDate
          }));

          setLeaves(data);
          setFilteredLeaves(data);
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
        setError(error.response?.data?.error || "Failed to fetch leaves");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  // Filters both by status and leave type
  const applyFilters = (status = selectedStatus, leaveType = selectedLeaveType) => {
    setSelectedStatus(status);
    setSelectedLeaveType(leaveType);

    const data = (leaves || []).filter((leave) => {
      const matchStatus = status === "All" || leave.status?.toLowerCase() === status.toLowerCase();
      const matchType = leaveType === "All" || leave.leaveType === leaveType;
      return matchStatus && matchType;
    });

    setFilteredLeaves(data);
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = (leaves || []).filter(
      (leave) =>
        (leave.employee_id?.toLowerCase() || "").includes(searchTerm) ||
        (leave.name?.toLowerCase() || "").includes(searchTerm) ||
        (leave.days?.toString().includes(searchTerm))
    );
    setFilteredLeaves(filtered);
  };

  const uniqueLeaveTypes = Array.from(new Set((leaves || []).map((leave) => leave.leaveType)));

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold">Manage Leaves</h3>
      </div>

      <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search By Emp Id, Name or Days"
          className="px-4 py-2 border rounded w-full sm:w-1/2"
          onChange={handleSearch}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          {["Pending", "Approved", "Rejected", "All"].map((status) => (
            <button
              key={status}
              onClick={() => applyFilters(status, selectedLeaveType)}
              className={`px-3 py-1 rounded text-white ${
                selectedStatus === status ? "bg-teal-600" : "bg-gray-500"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Leave Type Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => applyFilters(selectedStatus, "All")}
            className={`px-3 py-1 rounded text-white ${
              selectedLeaveType === "All" ? "bg-teal-600" : "bg-gray-500"
            }`}
          >
            All Types
          </button>
          {uniqueLeaveTypes.map((type) => (
            <button
              key={type}
              onClick={() => applyFilters(selectedStatus, type)}
              className={`px-3 py-1 rounded text-white ${
                selectedLeaveType === type ? "bg-teal-600" : "bg-gray-500"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLeaves || []}
        pagination
        noDataComponent="No leaves found"
      />
    </div>
  );
};

export default Table;
