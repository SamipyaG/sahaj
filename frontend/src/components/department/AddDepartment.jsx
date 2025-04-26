import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddDepartment = () => {
    const [department, setDepartment] = useState({
        department_id: '',   // Added department_id
        department_name: '',
        department_description: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDepartment({ ...department, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!department.department_id || !department.department_name) {
            alert("Department ID and Name are required.");
            return;
        }

        try {
            // First, check if department_id already exists
            const checkResponse = await axios.get(
                `http://localhost:5000/api/department/check-id/${department.department_id}`,
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            if (!checkResponse.data.available) {
                alert("Department ID already exists. Please choose a unique ID.");
                return;
            }

            // Proceed with adding department
            const response = await axios.post(
                `http://localhost:5000/api/department/add`,
                { 
                    ...department, 
                    paid_leave: 16  // Always set paid_leave to 16 but don't show in UI
                },
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            if (response.data.success) {
                navigate("/admin-dashboard/departments");
            } else {
                alert(response.data.error || "Something went wrong.");
            }
        } catch (error) {
            console.error("Error adding department:", error);
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            } else {
                alert("An error occurred while adding the department.");
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md w-96">
            <h2 className="text-2xl font-bold mb-6">Add New Department</h2>
            <form onSubmit={handleSubmit}>
                {/* Department ID Field */}
                <div>
                    <label htmlFor="department_id" className="text-sm font-medium text-gray-700">
                        Department ID
                    </label>
                    <input
                        type="text"
                        name="department_id"
                        value={department.department_id}
                        onChange={handleChange}
                        placeholder="Unique Department ID"
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                {/* Department Name Field */}
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

                {/* Department Description Field */}
                <div className="mt-3">
                    <label htmlFor="department_description" className="text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        name="department_description"
                        value={department.department_description}
                        onChange={handleChange}
                        placeholder="Department Description"
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                        rows="4"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
                >
                    Add Department
                </button>
            </form>
        </div>
    );
};

export default AddDepartment;
