import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState({
    department_id: "",
    department_name: "",
    department_description: "",
    paid_leave: 16, // Default value
  });

  const [depLoading, setDepLoading] = useState(false);
  const [existingDepartments, setExistingDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartment = async () => {
      setDepLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/department/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setDepartment(response.data.department);
        }
      } catch (error) {
        console.error("Error fetching department:", error);
        alert(error.response?.data?.error || "Failed to load department.");
      } finally {
        setDepLoading(false);
      }
    };

    const fetchAllDepartments = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/department`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setExistingDepartments(response.data.departments);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartment();
    fetchAllDepartments();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDepartment({ ...department, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if department_id is unique
    const isDuplicateId = existingDepartments.some(
      (dep) => dep.department_id === department.department_id && dep._id !== id
    );

    if (isDuplicateId) {
      alert("Department ID must be unique.");
      return;
    }

    try {
      const response = await axios.put(`http://localhost:5000/api/department/${id}`, department, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        navigate("/admin-dashboard/departments");
      }
    } catch (error) {
      console.error("Error updating department:", error);
      alert(error.response?.data?.error || "Failed to update department.");
    }
  };

  return (
    <>
      {depLoading ? (
        <div>Loading ...</div>
      ) : (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6">Edit Department</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="department_id" className="text-sm font-medium text-gray-700">
                Department ID
              </label>
              <input
                type="text"
                name="department_id"
                value={department.department_id}
                onChange={handleChange}
                placeholder="Department ID"
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mt-3">
              <label htmlFor="department_name" className="text-sm font-medium text-gray-700">
                Department Name
              </label>
              <input
                type="text"
                name="department_name"
                value={department.department_name}
                onChange={handleChange}
                placeholder="Department Name"
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mt-3">
              <label htmlFor="department_description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="department_description"
                value={department.department_description}
                onChange={handleChange}
                placeholder="Department Description"
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                rows="4"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="paid_leave" className="text-sm font-medium text-gray-700">
                Paid Leave
              </label>
              <input
                type="number"
                name="paid_leave"
                value={department.paid_leave}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>

            <button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded">
              Update Department
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default EditDepartment;
