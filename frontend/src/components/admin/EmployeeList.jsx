import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setEmployees(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to fetch employees');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      message.success('Employee deleted successfully');
      // Update the state to remove the deleted employee
      setEmployees(employees.filter(employee => employee._id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error);
      message.error('Failed to delete employee');
    }
  };

  const columns = [
    {
      title: 'S.No',
      key: 'serialNumber',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Profile',
      dataIndex: ['user', 'profileImage'],
      key: 'profileImage',
      render: (profileImage) => (
        <img
          src={`http://localhost:5000/uploads/${profileImage}`}
          alt="Profile"
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          onError={(e) => { e.target.onerror = null; e.target.src = 'http://localhost:5000/uploads/default.png'; }}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: ['user', 'name'],
      key: 'name',
    },
    {
      title: 'DOB',
      dataIndex: 'date_of_birth',
      key: 'date_of_birth',
      render: (dob) => (dob ? new Date(dob).toLocaleDateString() : 'N/A'),
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department',
    },
    {
      title: 'Designation',
      dataIndex: 'designation_name',
      key: 'designation',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="primary" onClick={() => navigate(`/admin/employees/view/${record._id}`)}>
            View
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/employees/edit/${record._id}`)}
          >
            Edit
          </Button>
          <Button type="primary" onClick={() => navigate(`/admin/employees/salary/${record._id}`)} style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}>
            Salary
          </Button>
          <Button type="primary" danger onClick={() => navigate(`/admin/employees/leave/${record._id}`)}>
            Leave
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this employee?"
            description="This action cannot be undone. Both employee and user data will be permanently deleted."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Employee List</h2>
        <Button type="primary" onClick={() => navigate('/admin/employees/add')}>
          Add New Employee
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={employees}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default EmployeeList; 