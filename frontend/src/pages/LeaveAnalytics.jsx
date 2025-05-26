import React from 'react';
import { Navigate } from 'react-router-dom';
import DepartmentLeaveChart from '../components/analytics/DepartmentLeaveChart';
import MonthlyLeaveTrend from '../components/analytics/MonthlyLeaveTrend';
import TopLeaveTakers from '../components/analytics/TopLeaveTakers';
import LeaveBalanceOverview from '../components/analytics/LeaveBalanceOverview';
import TeamAvailabilityHeatmap from '../components/analytics/TeamAvailabilityHeatmap';

const LeaveAnalytics = () => {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Get user role from token
  const userRole = JSON.parse(atob(token.split('.')[1])).role;

  // Only allow admin and HR roles to access analytics
  if (!['admin', 'hr'].includes(userRole)) {
    return <Navigate to="/employee-dashboard" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Leave Analytics Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Leave Chart */}
        <div className="lg:col-span-2">
          <DepartmentLeaveChart />
        </div>

        {/* Monthly Leave Trend */}
        <div className="lg:col-span-2">
          <MonthlyLeaveTrend />
        </div>

        {/* Top Leave Takers */}
        <div>
          <TopLeaveTakers />
        </div>

        {/* Leave Balance Overview */}
        <div>
          <LeaveBalanceOverview />
        </div>

        {/* Team Availability Heatmap */}
        <div className="lg:col-span-2">
          <TeamAvailabilityHeatmap />
        </div>
      </div>
    </div>
  );
};

export default LeaveAnalytics; 