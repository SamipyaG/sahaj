import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export const columns = [
  {
    name: "S No",
    selector: (row) => row.sno,
    width: "70px",
  },
  {
    name: "Name",
    selector: (row) => row.name,
    sortable: true,
    width: "100px",
  },
  {
    name: "Image",
    selector: (row) => row.profileImage,
    width: "90px",
  },
  {
    name: "Department",
    selector: (row) => row.department_name,
    width: "120px",
  },
  {
    name: "DOB",
    selector: (row) => row.dob,
    sortable: true,
    width: "130px",
  },
  {
    name: "Action",
    selector: (row) => row.action,
    center: true, // Fix: "center" should not be a string
  },
];

// ✅ Fetch Departments (Already Correct)
export const fetchDepartments = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/department`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.data.success) {
      return response.data.departments;
    }
  } catch (error) {
    if (error.response && !error.response.data.success) {
      alert(error.response.data.error);
    }
  }
  return [];
};

// ✅ Fetch Designations 
export const fetchDesignations = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/designation`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.data.success) {
      return response.data.designations;
    }
  } catch (error) {
    if (error.response && !error.response.data.success) {
      alert(error.response.data.error);
    }
  }
  return [];
};

// ✅ Get Employees for Salary Form 
export const getEmployees = async (id) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/employee/department/${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.employees;
    }
  } catch (error) {
    if (error.response && !error.response.data.success) {
      alert(error.response.data.error);
    }
  }
  return [];
};

export const EmployeeButtons = ({ Id }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-start space-x-2">
      <button
        className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
        onClick={() => navigate(`/admin-dashboard/employees/${Id}`)}
      >
        View
      </button>
      <button
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        onClick={() => navigate(`/admin-dashboard/employees/edit/${Id}`)}
      >
        Edit
      </button>
      <button
        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
        onClick={() => navigate(`/admin-dashboard/employees/salary/${Id}`)}
      >
        Salary
      </button>
      <button
        className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        onClick={() => navigate(`/admin-dashboard/employees/leaves/${Id}`)}
      >
        Leave
      </button>
      <button
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        onClick={() => handleDelete(Id)}
      >
        Delete
      </button>
    </div>
  );
};

const handleDelete = async (id) => {
  const confirm = window.confirm("Are you sure you want to remove this employee from the system?");
  if (confirm) {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/employee/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        alert('Employee has been successfully removed from the system');
        window.location.reload();
      }
    } catch (error) {
      if (error.response && !error.response.data.success) {
        alert(error.response.data.error || "Unable to remove employee. Please try again.");
      } else {
        alert("Something went wrong. Please try again later.");
      }
    }
  }
};
