import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { columns, LeaveButtons } from "../../utils/LeaveHelper";
import axios from "axios";

const Table = () => {
  const [leaves, setLeaves] = useState(null);
  const [filteredLeaves, setFilteredLeaves] = useState(null);

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
            employee_id: leave.employee_id.employee_id,
            name: leave.employee_id.user_id.name,
            leaveType: leave.leave_setup_id.
            leaveType,
            department: leave.employee_id.department_id.department_name,
            days: leave.numOfDays,
            status: leave.status,
            action: <LeaveButtons Id={leave._id} />,
          }));
          setLeaves(data);
          setFilteredLeaves(data);
          console.log("Fetched leaves:", data); // Better logging
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
        if (error.response && !error.response.data.success) {
          alert(error.response.data.error);
        }
      }
    };
    fetchLeaves();
  }, []);

  const filterByInput = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const data = leaves.filter((leave) =>
      leave.employee_id.toLowerCase().includes(searchTerm) ||
      leave.name.toLowerCase().includes(searchTerm)
    );
    setFilteredLeaves(data);
  };

  const filterByButton = (status) => {
    const data = leaves.filter((leave) =>
      leave.status.toLowerCase() === status.toLowerCase()
    );
    setFilteredLeaves(data);
  };

  return (
    <>
      {filteredLeaves ? (
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Manage Leaves</h3>
          </div>
          <div className="flex justify-between items-center">
            <input
              type="text"
              placeholder="Search By Emp Id or Name"
              className="px-4 py-0.5 border"
              onChange={filterByInput}
            />
            <div className="space-x-3">
              <button 
                className="px-2 py-1 bg-teal-600 text-white hover:bg-teal-700"
                onClick={() => filterByButton("Pending")}
              >
                Pending
              </button>
              <button 
                className="px-2 py-1 bg-teal-600 text-white hover:bg-teal-700"
                onClick={() => filterByButton("Approved")}
              >
                Approved
              </button>
              <button 
                className="px-2 py-1 bg-teal-600 text-white hover:bg-teal-700"
                onClick={() => filterByButton("Rejected")}
              >
                Rejected
              </button>
              <button 
                className="px-2 py-1 bg-gray-600 text-white hover:bg-gray-700"
                onClick={() => setFilteredLeaves(leaves)}
              >
                All
              </button>
            </div>
          </div>

          <div className="mt-3">
            <DataTable 
              columns={columns} 
              data={filteredLeaves} 
              pagination 
              noDataComponent="No leaves found"
            />
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </>
  );
};

export default Table;