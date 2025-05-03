import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { columns, LeaveButtons } from "../../utils/LeaveHelper";
import axios from "axios";

const Table = () => {
  const [leaves, setLeaves] = useState(null);
  const [filteredLeaves, setFilteredLeaves] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            days: leave.numOfDays,
            status: leave.status,
            action: <LeaveButtons Id={leave._id} />,
          }));
          setLeaves(data);
          setFilteredLeaves(data);
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
        setError(error.response?.data?.error || "Failed to fetch leaves");
        if (error.response && !error.response.data.success) {
          alert(error.response.data.error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const filterByInput = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    if (!searchTerm) {
      setFilteredLeaves(leaves);
      return;
    }
    
    const data = leaves.filter((leave) =>
      (leave.employee_id?.toLowerCase() || "").includes(searchTerm) ||
      (leave.name?.toLowerCase() || "").includes(searchTerm)
    );
    setFilteredLeaves(data);
  };

  const filterByButton = (status) => {
    if (status === "All") {
      setFilteredLeaves(leaves);
    } else {
      const data = leaves.filter((leave) =>
        leave.status?.toLowerCase() === status.toLowerCase()
      );
      setFilteredLeaves(data);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold">Manage Leaves</h3>
      </div>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search By Emp Id or Name"
          className="px-4 py-2 border rounded"
          onChange={filterByInput}
        />
        <div className="space-x-3">
          {["Pending", "Approved", "Rejected", "All"].map((status) => (
            <button
              key={status}
              className={`px-3 py-1 rounded text-white hover:opacity-90 ${
                status === "All" ? "bg-gray-600" : "bg-teal-600"
              }`}
              onClick={() => filterByButton(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <DataTable 
          columns={columns} 
          data={filteredLeaves || []} 
          pagination 
          noDataComponent="No leaves found"
        />
      </div>
    </div>
  );
};

export default Table;