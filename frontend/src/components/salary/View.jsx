import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const EmployeeSalaryView = () => {
  const { id } = useParams();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/salary/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setSalaries(response.data.data.docs || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching salaries:', err);
        setError(err.response?.data?.error || 'Failed to fetch salary records');
        setLoading(false);
      }
    };

    fetchSalaries();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Salary History</h2>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Type</th>
              <th>Basic Salary</th>
              <th>Allowances</th>
              <th>Tax</th>
              <th>Leave Deduction</th>
              <th>Net Salary</th>
              <th>Pay Date</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((salary) => (
              <tr key={salary._id}>
                <td className="text-capitalize">{salary.salary_type}</td>
                <td>₹{salary.basic_salary?.toLocaleString() || 0}</td>
                <td>₹{salary.allowances?.toLocaleString() || 0}</td>
                <td>₹{salary.tax?.toLocaleString() || 0}</td>
                <td>₹{salary.leave_deduction?.toLocaleString() || 0}</td>
                <td>₹{salary.gross_salary?.toLocaleString() || 0}</td>
                <td>{new Date(salary.pay_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeSalaryView;