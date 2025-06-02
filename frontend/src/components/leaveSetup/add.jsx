import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddLeaveSetup = () => {
    const [leaveSetup, setLeaveSetup] = useState({
        leaveType: '',
        maxDays: '',
        description: '',
        deductSalary: false,
        noRestrictions: false
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLeaveSetup({
            ...leaveSetup,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!leaveSetup.leaveType) {
            alert("Leave Type is required.");
            return;
        }

        // If noRestrictions is true, set maxDays to 0
        if (leaveSetup.noRestrictions) {
            leaveSetup.maxDays = 0;
        } else if (!leaveSetup.maxDays) {
            alert("Max Days is required for restricted leave types.");
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/leave-setup/add`,
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
            console.error("Error adding leave setup:", error.response?.data || error.message);
            alert("An error occurred while adding the leave setup.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md w-96">
            <h2 className="text-2xl font-bold mb-6">Add New Leave Setup</h2>
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
                        disabled={leaveSetup.noRestrictions}
                        required={!leaveSetup.noRestrictions}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {leaveSetup.noRestrictions ?
                            "Max days is not required for unrestricted leave types" :
                            "Enter 0 for unlimited days"}
                    </p>
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

                <div className="mt-4 space-y-3">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="noRestrictions"
                            checked={leaveSetup.noRestrictions}
                            onChange={handleChange}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                            No Restrictions (Unlimited Days)
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="deductSalary"
                            checked={leaveSetup.deductSalary}
                            onChange={handleChange}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                            Deduct Salary
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
                >
                    Add Leave Setup
                </button>
            </form>
        </div>
    );
};

export default AddLeaveSetup;