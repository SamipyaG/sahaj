import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmployeeButtons } from "../../utils/EmployeeHelper";
import DataTable from "react-data-table-component";
import axios from "axios";
import { FaSpinner } from "react-icons/fa";

const List = () => {
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setEmpLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/employee`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        console.log("API Response:", response.data); // Debug log

        if (response.data.success) {

          let sno = 1;
          const data = response.data.data.map((emp) => {
            console.log((emp.user?.profileImage || emp.user_id?.profileImage)
              ? `http://localhost:5000/${emp.user?.profileImage || emp.user_id?.profileImage}`
              : "/default-profile.png")
            return ({
              _id: emp._id,
              sno: sno++,
              department_name: emp.department_name || emp.department_id?.department_name || "N/A",
              name: emp.employee_name || emp.user?.name || emp.user_id?.name || "Unknown",
              dob: emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString() : "N/A",
              profileImage: (
                <img
                  width={40}
                  className="rounded-full" crossorigin="anonymous"
                  src={
                    (emp.user?.profileImage || emp.user_id?.profileImage)
                      ? `http://localhost:5000/${emp.user?.profileImage || emp.user_id?.profileImage}`
                      : "/default-profile.png"
                  }
                  alt={`${emp.employee_name}'s Profile`}
                  onError={(e) => {
                    e.target.src = "/default-profile.png";
                  }}
                />
              ),
              action: <EmployeeButtons Id={emp._id} />,

            })
          });

          setEmployees(data);
          setFilteredEmployees(data);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        if (error.response && !error.response.data.success) {
          alert(error.response.data.error || "Failed to fetch employees");
        } else {
          alert("An error occurred while fetching employees");
        }
      } finally {
        setEmpLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleFilter = (e) => {
    const searchValue = e.target.value.toLowerCase();
    const records = employees.filter((emp) =>
      emp.department_name.toLowerCase().includes(searchValue)
    );
    setFilteredEmployees(records);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Unable to load employee list</p>
          <p className="text-gray-600">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  if (!employees.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">No employees found</p>
          <p className="text-gray-500">Add new employees to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold">Manage Employees</h3>
      </div>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search By Department Name"
          className="px-4 py-2 border rounded w-64"
          onChange={handleFilter}
        />
        <Link
          to="/admin-dashboard/add-employee"
          className="px-4 py-2 bg-teal-600 rounded text-white hover:bg-teal-700"
        >
          Add New Employee
        </Link>
      </div>
      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          columns={[
            { name: "S.No", selector: (row) => row.sno, sortable: true, width: "80px" },
            { name: "Profile", selector: (row) => row.profileImage, width: "100px" },
            { name: "Name", selector: (row) => row.name, sortable: true },
            { name: "DOB", selector: (row) => row.dob, sortable: true, width: "120px" },
            { name: "Department", selector: (row) => row.department_name, sortable: true },
            { name: "Actions", selector: (row) => row.action, width: "400px" },
          ]}
          data={filteredEmployees}
          pagination
          highlightOnHover
          responsive
          noDataComponent={<div className="p-4">No employees found</div>}
        />
      </div>
    </div>
  );
};

export default List;