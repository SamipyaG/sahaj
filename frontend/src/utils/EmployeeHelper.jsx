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
    name: "Profile",
    selector: (row) => row.profileImage,
    width: "100px",
  },
  {
    name: "Emp ID",
    selector: (row) => row.employee_id,
    width: "110px",
  },
  {
    name: "Name",
    selector: (row) => row.name,
    width: "120px",
  },
  {
    name: "DOB",
    selector: (row) => row.dob,
    width: "120px",
  },
  {
    name: "Department",
    selector: (row) => row.department_name,
    width: "150px",
  },
  {
    name: "Actions",
    selector: (row) => row.action,
    center: true,
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

export const EmployeeButtons = ({ Id, onEmployeeDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleView = (id) => {
    if (user.role === 'admin') {
      navigate(`/admin-dashboard/employees/${id}`);
    } else {
      // Assuming employees can view their own details on employee dashboard
      // You might need a different route for employee view
      navigate(`/employee-dashboard/employees/${id}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        // Call backend API to delete the employee
        const response = await axios.delete(`http://localhost:5000/api/employees/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data.success) {
          alert("Employee deleted successfully!");
          // Call the function passed from the parent to refresh the list
          if (onEmployeeDelete) {
            onEmployeeDelete();
          }
        } else {
          alert(response.data.error || "Failed to delete employee");
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert(error.response?.data?.error || "An error occurred while deleting the employee");
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        className="px-3 py-1 bg-teal-600 text-white"
        onClick={() => handleView(Id)}
      >
        View
      </button>
      <button
        className="px-3 py-1 bg-blue-600 text-white"
        onClick={() => navigate(`/admin-dashboard/employees/edit/${Id}`)}
      >
        Edit
      </button>


      <button
        className="px-3 py-1 bg-yellow-600 text-white"
        onClick={() => navigate(`/admin-dashboard/employees/salary/${Id}`)}
      >
        Salary
      </button>
      <button
        className="px-3 py-1 bg-red-600 text-white"
        onClick={() => navigate(`/admin-dashboard/employees/leaves/${Id}`)}
      >
        Leave
      </button>
      {user.role === 'admin' && (
        <button
          className="px-4 py-1 bg-red-500 rounded text-white hover:bg-red-600"
          onClick={() => handleDelete(Id)}
        >
          Delete
        </button>
      )}
    </div>
  );
};
