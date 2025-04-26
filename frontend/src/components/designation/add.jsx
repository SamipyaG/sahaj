import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddDesignation = () => {
    const [designation, setDesignation] = useState({
        title: '',
        basic_salary: '',  
        description: '',    
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDesignation({ ...designation, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!designation.title || !designation.basic_salary) {
            alert("Title and basic salary are required");
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/designation/add`, 
                designation,
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            if (response.data.success) {
                navigate("/admin-dashboard/designation");
            } else {
                alert(response.data.error || "Something went wrong.");
            }
        } catch (error) {
            console.error("Error adding designation:", error.response?.data || error.message);
            alert("An error occurred while adding the designation.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md w-96">
            <h2 className="text-2xl font-bold mb-6">Add New Designation</h2>
            <form onSubmit={handleSubmit}>
                <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Title*</label>
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
                    <label className="text-sm font-medium text-gray-700">Basic Salary*</label>
                    <input
                        type="number"
                        name="basic_salary"
                        value={designation.basic_salary}
                        onChange={handleChange}
                        placeholder="Basic Salary"
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <input
                        type="text"
                        name="description"
                        value={designation.description}
                        onChange={handleChange}
                        placeholder="Description (optional)"
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
                >
                    Add Designation
                </button>
            </form>
        </div>
    );
};

export default AddDesignation;