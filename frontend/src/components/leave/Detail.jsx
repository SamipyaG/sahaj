import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Detail = () => {
  const { id } = useParams();
  const [leave, setLeave] = useState(null);
  const navigate = useNavigate();

  // Function to calculate the number of days between two dates
  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return diffDays;
  };

  useEffect(() => {
    const fetchLeave = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/leave/detail/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.data.success) {
          setLeave(response.data.leave);
        }
      } catch (error) {
        console.log("Error: " + error);
        if (error.response && !error.response.data.success) {
          alert(error.response.data.error);
        }
      }
    };

    fetchLeave();
  }, [id]);

  const changeStatus = async (id, status) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/leave/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        navigate("/admin-dashboard/leaves");
      }
    } catch (error) {
      if (error.response && !error.response.data.success) {
        alert(error.response.data.error);
      }
    }
  };

  // Helper function to format date nicely
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <>
      {leave ? (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md">
          <h2 className="text-2xl font-bold mb-8 text-center">Leave Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img crossorigin="anonymous"
                src={`http://localhost:5000/${leave.employee_id.user_id.profileImage}`}
                className="rounded-full border w-72"
                alt="Profile"
              />
            </div>
            <div>
              <div className="flex space-x-3 mb-2">
                <p className="text-lg font-bold">Name:</p>
                <p className="font-medium">{leave.employee_id.user_id.name}</p>
              </div>
              <div className="flex space-x-3 mb-2">
                <p className="text-lg font-bold">Employee ID:</p>
                <p className="font-medium">{leave.employee_id.employee_id}</p>
              </div>
              <div className="flex space-x-3 mb-2">
                <p className="text-lg font-bold">Leave Type:</p>
                <p className="font-medium">{leave.leave_setup_id.leaveType}</p>
              </div>
              <div className="flex space-x-3 mb-2">
                <p className="text-lg font-bold">Reason:</p>
                <p className="font-medium">{leave.reason}</p>
              </div>
              <div className="flex space-x-3 mb-2">
                <p className="text-lg font-bold">Department:</p>
                <p className="font-medium">{leave.employee_id.department_id.department_name}</p>
              </div>

              {/* Nicely formatted dates */}
              <div className="flex space-x-3 mb-2">
                <p className="text-lg font-bold">Start Date:</p>
                <p className="font-medium">{formatDate(leave.startDate)}</p>
              </div>
              <div className="flex space-x-3 mb-2">
                <p className="text-lg font-bold">End Date:</p>
                <p className="font-medium">{formatDate(leave.endDate)}</p>
              </div>
              
              {/* Added Leave Days */}
              <div className="flex space-x-3 mb-2">
                <p className="text-lg font-bold">Total Days:</p>
                <p className="font-medium">
                  {calculateDays(leave.startDate, leave.endDate)} day(s)
                </p>
              </div>

              <div className="flex space-x-3 mb-2">
                <p className="text-lg font-bold">
                  {leave.status === "Pending" ? "Action:" : "Status:"}
                </p>
                {leave.status === "Pending" ? (
                  <div className="flex space-x-2">
                    <button
                      className="px-2 py-0.5 bg-teal-300 hover:bg-teal-400"
                      onClick={() => changeStatus(leave._id, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="px-2 py-0.5 bg-red-300 hover:bg-red-400"
                      onClick={() => changeStatus(leave._id, "Rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <p className="font-medium">{leave.status}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>Loading....</div>
      )}
    </>
  );
};

export default Detail;