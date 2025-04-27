import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { FaInfoCircle } from 'react-icons/fa';

const OverallSalaryStatus = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [salaryStatus, setSalaryStatus] = useState([]);

    useEffect(() => {
        const fetchSalaryStatus = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/salary/paidStatus');
                setSalaryStatus(response.data.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch salary status');
                setLoading(false);
            }
        };

        fetchSalaryStatus();
    }, []);

    const customStyles = {
        headCells: {
            style: {
                fontWeight: 'bold',
                fontSize: '14px',
                backgroundColor: '#f8f9fa',
            },
        },
        cells: {
            style: {
                padding: '10px',
            },
        },
    };

    const columns = [
        {
            name: 'S.N.',
            selector: row => row.sn,
            sortable: true,
            width: '80px',
            center: true,
        },
        {
            name: 'Year',
            selector: row => row.year,
            sortable: true,
            center: true,
        },
        {
            name: 'Month',
            selector: row => row.month,
            sortable: true,
            center: true,
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            center: true,
            cell: row => (
                <div 
                    style={{
                        backgroundColor: row.status === 'Processed' ? '#d4edda' : '#fff3cd',
                        color: row.status === 'Processed' ? '#155724' : '#856404',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontWeight: '500',
                        textAlign: 'center',
                        width: '100%',
                    }}
                >
                    {row.status}
                </div>
            ),
        },
        {
            name: 'Employees Paid',
            selector: row => row.paidCount,
            sortable: true,
            center: true,
            cell: row => (
                <div 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title={`Click to view ${row.paidCount} paid employees`}
                >
                    <div
                        style={{
                            backgroundColor: '#d1ecf1',
                            color: '#0c5460',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        onClick={() => {
                            // You can implement a modal or other UI to show the list
                            alert(`${row.paidCount} employees paid:\n${
                                row.employees.map(e => `${e.name} (${e.employeeId})`).join('\n')
                            }`);
                        }}
                    >
                        {row.paidCount} {row.paidCount === 1 ? 'employee' : 'employees'}
                        <FaInfoCircle style={{ marginLeft: '5px' }} />
                    </div>
                </div>
            ),
        },
        {
            name: 'Actions',
            cell: row => (
                <button
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: row.status === 'Processed' ? '#007bff' : '#28a745',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                    }}
                    title={row.status === 'Processed' ? 'View payroll details' : 'Process payroll'}
                    onClick={() => {
                        // Implement your action here
                        alert(row.status === 'Processed' ? 'Viewing details...' : 'Processing payroll...');
                    }}
                >
                    {row.status === 'Processed' ? 'View' : 'Process'}
                </button>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            center: true,
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>Loading salary status...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '10px',
                borderRadius: '4px',
                margin: '20px',
                border: '1px solid #f5c6cb',
            }}>
                {error}
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Overall Salary Payment Status (Last 12 Months)</h2>
            <DataTable
                columns={columns}
                data={salaryStatus}
                customStyles={customStyles}
                pagination
                highlightOnHover
                striped
                responsive
                noDataComponent="No salary records found"
            />
        </div>
    );
};

export default OverallSalaryStatus;