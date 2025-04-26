import axios from "axios";
import { useNavigate } from "react-router-dom";

export const columns = [
  {
    name: "S No",
    selector: (row) => row.sno,
  },
  {
    name: "Title",
    selector: (row) => row.title,
    sortable: true
  },
  {
    name: "Basic Salary",
    selector: (row) => row.basic_salary,
    sortable: true
  },
  {
    name: "Description",
    selector: (row) => row.description,
  },
  {
    name: "Action",
    selector: (row) => row.action,
  },
];

export const DesignationButtons = ({ Id, onDesignationDelete }) => {
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    const confirm = window.confirm("Do you want to delete this designation?");
    if (confirm) {
      try {
        const response = await axios.delete(
          `http://localhost:5000/api/designation/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.data.success) {
          onDesignationDelete();
        }
      } catch (error) {
        if (error.response && !error.response.data.success) {
          alert(error.response.data.error);
        } else {
          alert("An error occurred while deleting the designation");
        }
      }
    }
  };

  return (
    <div className="flex space-x-3">
      <button
        className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
        onClick={() => navigate(`/admin-dashboard/designation/edit/${Id}`)}
      >
        Edit
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