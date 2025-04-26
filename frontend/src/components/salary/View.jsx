import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/authContext";

const View = () => {
  const [salaries, setSalaries] = useState(null);
  const [filteredSalaries, setFilteredSalaries] = useState(null);
  const { id } = useParams();
  let sno = 1;
  const { user } = useAuth();

  const fetchSalaries = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/salary/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.data.success) {
        setSalaries(response.data.salary);
        setFilteredSalaries(response.data.salary);
      }
    } catch (error) {
      console.error("Error fetching salaries:", error);
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [id]);

  const filterSalaries = (q) => {
    const filteredRecords = salaries.filter((salary) =>
      salary.employee_id.employeeId.toLowerCase().includes(q.toLowerCase())
    );
    setFilteredSalaries(filteredRecords);
  };

  return (
    <div className="overflow-x-auto p-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Salary History</h2>
      </div>
      <div className="flex justify-end my-3">
        <input
          type="text"
          placeholder="Search By Emp ID"
          className="border px-2 rounded-md py-0.5 border-gray-300"
          onChange={(e) => filterSalaries(e.target.value)}
        />
      </div>

      {filteredSalaries === null ? (
        <div>Loading ...</div>
      ) : filteredSalaries.length > 0 ? (
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border border-gray-200">
            <tr>
              <th className="px-6 py-3">SNO</th>
              <th className="px-6 py-3">Emp ID</th>
              <th className="px-6 py-3">Salary ID</th>
              <th className="px-6 py-3">Basic Salary</th>
              <th className="px-6 py-3">Net Salary</th>
              <th className="px-6 py-3">Pay Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredSalaries.map((salary) => (
              <tr key={salary._id} className="bg-white border-b">
                <td className="px-6 py-3">{sno++}</td>
                <td className="px-6 py-3">{salary.employee_id.employeeId}</td>
                <td className="px-6 py-3">{salary.salary_id}</td>
                <td className="px-6 py-3">{salary.designation_id.basic_salary}</td>
                <td className="px-6 py-3">{salary.net_salary}</td>
                <td className="px-6 py-3">
                  {new Date(salary.Paydate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No Records Found</div>
      )}
    </div>
  );
};

export default View;