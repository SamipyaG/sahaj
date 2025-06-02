import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import PrivateRoutes from "./utils/PrivateRoutes";
import RoleBaseRoutes from "./utils/RoleBaseRoutes";
import AdminSummary from "./components/dashboard/AdminSummary";
import DepartmentList from "./components/department/DepartmentList";
import AddDepartment from "./components/department/AddDepartment";
import EditDepartment from "./components/department/EditDepartment";
import List from "./components/employee/List";
import AddEmployee from "./components/employee/AddEmployee";
import View from "./components/employee/View";
import Edit from "./components/employee/Edit";
import AutomaticSalary from "./components/salary/OverallSalaryStatus";
import SalaryView from "./components/salary/View";
import DesignationAdd from "./components/designation/add";
import DesignationEdit from "./components/designation/edit";
import DesignationList from "./components/designation/list";
import ViewSalary from "./components/salary/View";
import Summary from './components/EmployeeDashboard/Summary'
import LeaveList from './components/leave/List'
import AddLeave from './components/leave/Add'
import Setting from "./components/EmployeeDashboard/Setting";
import Table from "./components/leave/Table";
import Detail from "./components/leave/Detail";
import LeaveSeatupAdd from "./components/leaveSetup/add"
import LeaveSeatupEdit from "./components/leaveSetup/edit"
import LeaveSeatupList from "./components/leaveSetup/list"
import SalaryConfig from "./components/salary/SalaryConfig";
import LeaveHandover from "./components/leave/LeaveHandover";
import EmployeeLeaveHandover from "./components/employee/EmployeeLeaveHandover";
import Unauthorized from "./pages/Unauthorized";

// Import password reset components
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:userId/:code" element={<ResetPassword />} />
      <Route path="/" element={<Navigate to="/admin-dashboard" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin Dashboard Routes (Protected and Role-based)*/}
      <Route
        path="/admin-dashboard"
        element={
          <PrivateRoutes>
            <RoleBaseRoutes requiredRole={["admin"]}>
              <AdminDashboard />
            </RoleBaseRoutes>
          </PrivateRoutes>
        }
      >
        <Route index element={<AdminSummary />} />
        <Route path="departments" element={<DepartmentList />} />
        <Route path="add-department" element={<AddDepartment />} />
        <Route path="department/:id" element={<EditDepartment />} />

        {/* Employee Management Routes (Admin) */}
        <Route path="employees" element={<List />} />
        <Route path="add-employee" element={<AddEmployee />} />
        <Route path="employees/:id" element={<View />} />
        <Route path="employees/edit/:id" element={<Edit />} />
        <Route path="employees/salary/:id" element={<ViewSalary />} />

        {/* Salary Management Routes (Admin) */}
        <Route path="salary/automatic" element={<AutomaticSalary />} />
        <Route path="salary/view" element={<SalaryView />} />
        <Route path="salary/salaryconfig" element={<SalaryConfig />} />

        {/* Designation Management Routes (Admin) */}
        <Route path="designation/add" element={<DesignationAdd />} />
        <Route path="designation" element={<DesignationList />} />
        <Route path="designation/edit/:id" element={<DesignationEdit />} />

        {/* Leave Setup Management Routes (Admin)*/}
        <Route path="leave-Setup/add" element={<LeaveSeatupAdd />} />
        <Route path="leave-Setup/edit/:id" element={<LeaveSeatupEdit />} />
        <Route path="leave-Setup" element={<LeaveSeatupList />} />

        {/* Leave Management Routes (Admin)*/}
        <Route path="leaves" element={<Table />} />
        <Route path="leaves/:id" element={<Detail />} />
        <Route path="employees/leaves/:id" element={<LeaveList />} />

        {/* Leave Handover Management Routes (Admin)*/}
        <Route path="leave-handover" element={<LeaveHandover isAdmin={true} />} />

        <Route path="setting" element={<Setting />} />
      </Route>

      {/* Employee Dashboard Routes (Protected and Role-based) */}
      <Route
        path="/employee-dashboard"
        element={
          <PrivateRoutes>
            <RoleBaseRoutes requiredRole={["admin", "employee"]}>
              <EmployeeDashboard />
            </RoleBaseRoutes>
          </PrivateRoutes>
        }
      >
        <Route index element={<Summary />} />
        <Route path="profile/:id" element={<View />} />
        <Route path="leaves/:id" element={<LeaveList />} />
        <Route path="add-leave" element={<AddLeave />} />
        <Route path="salary/:id" element={<ViewSalary />} />
        <Route path="setting" element={<Setting />} />
        <Route path="leave-handover" element={<EmployeeLeaveHandover />} />
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
