import React, { useEffect, useState } from "react";
import { fetchDepartments, fetchDesignations } from "../../utils/EmployeeHelper";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const EditEmployee = () => {
  const [employee, setEmployee] = useState({
    name: "",
    maritalStatus: "",
    designation: "",
    department: "",
  });
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch Departments
  useEffect(() => {
    const getDepartments = async () => {
      try {
        const data = await fetchDepartments();
        setDepartments(data);
      } catch (error) {
        toast.error("Failed to load departments");
        console.error("Department fetch error:", error);
      }
    };
    getDepartments();
  }, []);

  // Fetch Employee Data
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/employee/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          const emp = response.data.data; // Changed from response.data.employee to response.data.data
          setEmployee({
            name: emp.user.name, // Changed from emp.userId.name to emp.user.name
            maritalStatus: emp.marital_status || "", // Changed from emp.maritalStatus
            designation: emp.designation_id?._id || "", // Changed from emp.designation
            department: emp.department_id?._id || "", // Changed from emp.department
          });

          // Fetch designations for the employee's department
          if (emp.department_id?._id) {
            const designationsData = await fetchDesignations(emp.department_id._id);
            setDesignations(designationsData);
          }
        }
      } catch (error) {
        console.error("Employee fetch error:", error);
        if (error.response && !error.response.data.success) {
          toast.error(error.response.data.error || "Failed to load employee data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  // Fetch Designations when Department changes
  const handleDepartmentChange = async (e) => {
    const departmentId = e.target.value;
    setEmployee((prev) => ({ ...prev, department: departmentId, designation: "" }));

    if (departmentId) {
      try {
        const designationsData = await fetchDesignations(departmentId);
        setDesignations(designationsData);
      } catch (error) {
        toast.error("Failed to load designations");
        console.error("Designation fetch error:", error);
      }
    } else {
      setDesignations([]);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const updateData = {
        name: employee.name.trim(),
        maritalStatus: employee.maritalStatus,
        designation: employee.designation,
        department: employee.department,
      };

      const response = await axios.put(
        `http://localhost:5000/api/employee/${id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Employee updated successfully");
        navigate("/admin-dashboard/employees");
      }
    } catch (error) {
      console.error("Update error:", error);
      if (error.response) {
        toast.error(
          error.response.data.error ||
          error.response.data.message ||
          "Failed to update employee"
        );
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Employee</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={employee.name}
              onChange={handleChange}
              placeholder="Employee Name"
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          {/* Marital Status Field */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marital Status
            </label>
            <select
              name="maritalStatus"
              onChange={handleChange}
              value={employee.maritalStatus}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              required
            >
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          {/* Department Field */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              name="department"
              onChange={handleDepartmentChange}
              value={employee.department}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              required
            >
              <option value="">Select Department</option>
              {departments.map((dep) => (
                <option key={dep._id} value={dep._id}>
                  {dep.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Designation Field */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation
            </label>
            <select
              name="designation"
              onChange={handleChange}
              value={employee.designation}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              required
              disabled={!employee.department}
            >
              <option value="">Select Designation</option>
              {designations.map((des) => (
                <option key={des._id} value={des._id}>
                  {des.title} (${des.basic_salary})
                </option>
              ))}
            </select>
            {!employee.department && (
              <p className="mt-1 text-sm text-gray-500">
                Please select a department first
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/admin-dashboard/employees")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updating}
            className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
              updating
                ? "bg-teal-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {updating ? "Updating..." : "Update Employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEmployee;