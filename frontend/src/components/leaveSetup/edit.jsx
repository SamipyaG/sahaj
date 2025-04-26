import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditLeaveSetup = () => {
    const { id } = useParams();
    const [leaveSetup, setLeaveSetup] = useState({
        leaveType: '',
        maxDays: '',
        description: '',
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchLeaveSetup();
    }, []);

    const fetchLeaveSetup = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/leave-setup/${id}`,
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            setLeaveSetup(response.data);
        } catch (error) {
            console.error("Error fetching leave setup:", error.response?.data || error.message);
            alert("An error occurred while fetching the leave setup.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLeaveSetup({ ...leaveSetup, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!leaveSetup.leaveType || !leaveSetup.maxDays) {
            alert("Leave Type and Max Days are required.");
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:5000/api/leave-setup/${id}`,
                leaveSetup,
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            if (response.data.success) {
                navigate("/admin-dashboard/leave-setup");
            } else {
                alert(response.data.error || "Something went wrong.");
            }
        } catch (error) {
            console.error("Error updating leave setup:", error.response?.data || error.message);
            alert("An error occurred while updating the leave setup.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md w-96">
            <h2 className="text-2xl font-bold mb-6">Edit Leave Setup</h2>
            <form onSubmit={handleSubmit}>
                <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Leave Type</label>
                    <input
                        type="text"
                        name="leaveType"
                        value={leaveSetup.leaveType}
                        onChange={handleChange}
                        placeholder="Leave Type"
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Max Days</label>
                    <input
                        type="number"
                        name="maxDays"
                        value={leaveSetup.maxDays}
                        onChange={handleChange}
                        placeholder="Max Days"
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        value={leaveSetup.description}
                        onChange={handleChange}
                        placeholder="Description"
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
                >
                    Update Leave Setup
                </button>
            </form>
        </div>
    );
};

export default EditLeaveSetup;