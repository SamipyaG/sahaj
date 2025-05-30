import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { columns, DepartmentButtons } from "../../utils/DepartmentHelper";
import axios from "axios";

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [depLoading, setDepLoading] = useState(false);
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  const fetchDepartments = useCallback(async () => {
    setDepLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/department`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        console.log(response.data.departments)
        let sno = 1;
        const data = response.data.departments.map((dep) => ({
          _id: dep._id,
          sno: sno++,
          department_name: dep.department_name,
          action: (
            <DepartmentButtons Id={dep._id} onDepartmentDelete={fetchDepartments} />
          ),
        }));
        setDepartments(data);
        setFilteredDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      alert(error.response?.data?.error || "Failed to fetch departments.");
    } finally {
      setDepLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const filterDepartments = (e) => {
    const searchValue = e.target.value.toLowerCase();
    const filtered = departments.filter((dep) =>
      dep.department_name.toLowerCase().includes(searchValue)
    );
    setFilteredDepartments(filtered);
  };

  return (
    <>
      {depLoading ? (
        <div>Loading ...</div>
      ) : (
        <div className="p-5">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Manage Departments</h3>
          </div>
          <div className="flex justify-between items-center">
            <input
              type="text"
              placeholder="Search By Department Name"
              className="px-4 py-1 border rounded-md"
              onChange={filterDepartments}
            />
            <Link
              to="/admin-dashboard/add-department"
              className="px-4 py-1 bg-teal-600 rounded text-white"
            >
              Add New Department
            </Link>
          </div>
          <div className="mt-5">
            <DataTable columns={columns} data={filteredDepartments} pagination />
          </div>
        </div>
      )}
    </>
  );
};

export default DepartmentList;
