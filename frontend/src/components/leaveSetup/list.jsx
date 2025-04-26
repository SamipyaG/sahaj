import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";

const ListLeaveSetup = () => {
    const [leaveSetups, setLeaveSetups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filteredLeaveSetups, setFilteredLeaveSetups] = useState([]);

    const columns = [
        {
            name: "S.No",
            selector: (row) => row.sno,
            sortable: true,
        },
        {
            name: "Leave Type",
            selector: (row) => row.leaveType,
            sortable: true,
        },
        {
            name: "Max Days",
            selector: (row) => row.maxDays,
            sortable: true,
        },
        {
            name: "Description",
            selector: (row) => row.description,
            sortable: true,
        },
        {
            name: "Actions",
            selector: (row) => row.action,
        },
    ];

    const LeaveSetupButtons = ({ Id, onLeaveSetupDelete }) => {
        return (
            <div>
                <Link
                    to={`/admin-dashboard/leave-setup/edit/${Id}`}
                    className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
                >
                    Edit
                </Link>
                <button
                    onClick={() => {
                        if (window.confirm("Are you sure you want to delete this leave setup?")) {
                            handleDelete(Id);
                        }
                    }}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                >
                    Delete
                </button>
            </div>
        );
    };

    const fetchLeaveSetups = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/leave-setup`,
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            
            let sno = 1;
            const data = response.data.leaveSetups.map((leaveSetup) => ({
                _id: leaveSetup._id,
                sno: sno++,
                leaveType: leaveSetup.leaveType,
                maxDays: leaveSetup.maxDays,
                description: leaveSetup.description || "N/A",
                action: <LeaveSetupButtons 
                          Id={leaveSetup._id} 
                          onLeaveSetupDelete={fetchLeaveSetups} 
                       />,
            }));
            
            setLeaveSetups(data);
            setFilteredLeaveSetups(data);
        } catch (error) {
            console.error("Error fetching leave setups:", error.response?.data || error.message);
            alert(error.response?.data?.error || "Failed to fetch leave setups.");
        } finally {
            setLoading(false);
        }
    }, []); // Don't forget the dependency array

    useEffect(() => {
        fetchLeaveSetups();
    }, [fetchLeaveSetups]);

    const handleDelete = async (id) => {
        console.log(id);
        try {
            const response = await axios.delete(
                `http://localhost:5000/api/leave-setup/${id}`,
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            if (response.data.success) {
                fetchLeaveSetups(); // Refresh the list after deletion
            } else {
                alert(response.data.error || "Something went wrong.");
            }
        } catch (error) {
            console.error("Error deleting leave setup:", error.response?.data || error.message);
            alert("An error occurred while deleting the leave setup.");
        }
    };

    const filterLeaveSetups = (e) => {
        const searchValue = e.target.value.toLowerCase();
        const filtered = leaveSetups.filter((setup) =>
            setup.leaveType.toLowerCase().includes(searchValue)
        );
        setFilteredLeaveSetups(filtered);
    };

    return (
        <>
            {loading ? (
                <div>Loading ...</div>
            ) : (
                <div className="p-5">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold">Manage Leave Setups</h3>
                    </div>
                    <div className="flex justify-between items-center">
                        <input
                            type="text"
                            placeholder="Search By Leave Type"
                            className="px-4 py-1 border rounded-md"
                            onChange={filterLeaveSetups}
                        />
                        <Link
                            to="/admin-dashboard/leave-setup/add"
                            className="px-4 py-1 bg-teal-600 rounded text-white"
                        >
                            Add New Leave Setup
                        </Link>
                    </div>
                    <div className="mt-5">
                        <DataTable 
                            columns={columns} 
                            data={filteredLeaveSetups} 
                            pagination 
                            highlightOnHover
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ListLeaveSetup;