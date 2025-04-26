import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { columns, DesignationButtons } from "../../utils/DesignationHelper";
import axios from "axios";

const DesignationList = () => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredDesignations, setFilteredDesignations] = useState([]);

  const fetchDesignations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/designation`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        let sno = 1;
        const data = response.data.designations.map((des) => ({
          _id: des._id,
          sno: sno++,
          title: des.title,  // Changed from designation_name to title
          basic_salary: des.basic_salary,  // Fixed case (basic_Salary to basic_salary)
          description: des.description || "N/A",  // Added description field
          action: (
            <DesignationButtons Id={des._id} onDesignationDelete={fetchDesignations} />
          ),
        }));
        setDesignations(data);
        setFilteredDesignations(data);
      }
    } catch (error) {
      console.error("Error fetching designations:", error);
      alert(error.response?.data?.error || "Failed to fetch designations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const filterDesignations = (e) => {
    const searchValue = e.target.value.toLowerCase();
    const filtered = designations.filter((des) =>
      des.title.toLowerCase().includes(searchValue)  // Changed from designation_name to title
    );
    setFilteredDesignations(filtered);
  };

  return (
    <>
      {loading ? (
        <div>Loading ...</div>
      ) : (
        <div className="p-5">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Manage Designations</h3>
          </div>
          <div className="flex justify-between items-center">
            <input
              type="text"
              placeholder="Search By Designation Title"  // Updated placeholder text
              className="px-4 py-1 border rounded-md"
              onChange={filterDesignations}
            />
            <Link
              to="/admin-dashboard/designation/add"
              className="px-4 py-1 bg-teal-600 rounded text-white"
            >
              Add New Designation
            </Link>
          </div>
          <div className="mt-5">
            <DataTable columns={columns} data={filteredDesignations} pagination />
          </div>
        </div>
      )}
    </>
  );
};

export default DesignationList;