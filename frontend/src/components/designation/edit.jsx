import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditDesignation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [designation, setDesignation] = useState({
    designation_id: "",
    title: "",
    basic_salary: "",
    allowance: "",
    description: "",
  });

  const [desLoading, setDesLoading] = useState(false);

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

    fetchDesignation();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDesignation({ ...designation, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                readOnly
                disabled
              />
            </div>

            <div className="mt-3">
              <label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={designation.title}
                onChange={handleChange}
                placeholder="Designation Title"
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mt-3">
              <label htmlFor="basic_salary" className="text-sm font-medium text-gray-700">
                Basic Salary
              </label>
              <input
                type="number"
                name="basic_salary"
                value={designation.basic_salary}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mt-3">
              <label htmlFor="allowance" className="text-sm font-medium text-gray-700">
                Allowance
              </label>
              <input
                type="number"
                name="allowance"
                value={designation.allowance}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mt-3">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={designation.description}
                onChange={handleChange}
                placeholder="Description (optional)"
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
