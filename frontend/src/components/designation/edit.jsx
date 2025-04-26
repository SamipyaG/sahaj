import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditDesignation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [designation, setDesignation] = useState({
    designation_id: "",
    designation_name: "",
    basic_Salary: "",
    allowances: "",
    deductions: "",
  });

  const [desLoading, setDesLoading] = useState(false);
  const [existingDesignations, setExistingDesignations] = useState([]);

  useEffect(() => {
    const fetchDesignation = async () => {
      setDesLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/designation/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setDesignation(response.data.designation);
        }
      } catch (error) {
        console.error("Error fetching designation:", error);
        alert(error.response?.data?.error || "Failed to load designation.");
      } finally {
        setDesLoading(false);
      }
    };

    const fetchAllDesignations = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/designation`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setExistingDesignations(response.data.designations);
        }
      } catch (error) {
        console.error("Error fetching designations:", error);
      }
    };

    fetchDesignation();
    fetchAllDesignations();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDesignation({ ...designation, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if designation_id is unique
    const isDuplicateId = existingDesignations.some(
      (des) => des.designation_id === designation.designation_id && des._id !== id
    );

    if (isDuplicateId) {
      alert("Designation ID must be unique.");
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/designation/${id}`,
        designation,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        navigate("/admin-dashboard/designation");
      }
    } catch (error) {
      console.error("Error updating designation:", error);
      alert(error.response?.data?.error || "Failed to update designation.");
    }
  };

  return (
    <>
      {desLoading ? (
        <div>Loading ...</div>
      ) : (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6">Edit Designation</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="designation_id" className="text-sm font-medium text-gray-700">
                Designation ID
              </label>
              <input
                type="text"
                name="designation_id"
                value={designation.designation_id}
                onChange={handleChange}
                placeholder="Designation ID"
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mt-3">
              <label htmlFor="designation_name" className="text-sm font-medium text-gray-700">
                Designation Name
              </label>
              <input
                type="text"
                name="designation_name"
                value={designation.designation_name}
                onChange={handleChange}
                placeholder="Designation Name"
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mt-3">
              <label htmlFor="basic_Salary" className="text-sm font-medium text-gray-700">
                Basic Salary
              </label>
              <input
                type="number"
                name="basic_Salary"
                value={designation.basic_Salary}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mt-3">
              <label htmlFor="allowances" className="text-sm font-medium text-gray-700">
                allowances
              </label>
              <input
                type="number"
                name="allowances"
                value={designation.allowances}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="deductions" className="text-sm font-medium text-gray-700">
                Deductions
              </label>
              <input
                type="number"
                name="deductions"
                value={designation.deductions}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              />
            </div>


            <button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded">
              Update Designation
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default EditDesignation;
