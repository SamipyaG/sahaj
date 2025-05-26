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
        const response = await axios.get(`http://localhost:5000/api/employees/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          const emp = response.data.data;
          setEmployee({
            name: emp.user.name,
            maritalStatus: emp.marital_status || "",
            designation: emp.designation_id?._id || "",
            department: emp.department_id?._id || "",
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-700">Loading employee data...</h3>
          <p className="text-gray-500 mt-1">Please wait while we fetch the details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Edit Employee</h2>
            <p className="mt-1 text-sm text-gray-500">
              Update employee information below
            </p>
          </div>
          <button
            onClick={() => navigate("/admin-dashboard/employees")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ← Back to Employees
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-500 to-purple-600">
            <h3 className="text-lg leading-6 font-medium text-white">
              Employee Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-indigo-100">
              Update the employee information as needed
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={employee.name}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    required
                  />
                </div>
              </div>

              {/* Marital Status Field */}
              <div>
                <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
                  Marital Status
                </label>
                <div className="mt-1">
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={employee.maritalStatus}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>

              {/* Department Field */}
              <div className="sm:col-span-2">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <div className="mt-1">
                  <select
                    id="department"
                    name="department"
                    value={employee.department}
                    onChange={handleDepartmentChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
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
              </div>

              {/* Designation Field */}
              <div className="sm:col-span-2">
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                  Designation
                </label>
                <div className="mt-1">
                  <select
                    id="designation"
                    name="designation"
                    value={employee.designation}
                    onChange={handleChange}
                    disabled={!employee.department}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${!employee.department ? "bg-gray-100" : ""
                      }`}
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map((des) => (
                      <option key={des._id} value={des._id}>
                        {des.title} (${des.basic_salary.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                {!employee.department && (
                  <p className="mt-2 text-sm text-gray-500">
                    Please select a department first to see available designations
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate("/admin-dashboard/employees")}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${updating
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
              >
                {updating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : "Update Employee"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEmployee;