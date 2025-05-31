import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Add from "./components/employee/Add";
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

// Import password reset components
import ForgotPassword from './pages/ForgotPassword.jsx'; // Fixed extension
import ResetPassword from './pages/ResetPassword.jsx'; // Fixed extension

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:userId/:code" element={<ResetPassword />} />
        <Route path="/" element={<Navigate to="/admin-dashboard" />}></Route>
        <Route path="/login" element={<Login />}></Route>

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
          <Route index element={<AdminSummary />}></Route>

          <Route
            path="/admin-dashboard/departments"
            element={<DepartmentList />}
          ></Route>
          <Route
            path="/admin-dashboard/add-department"
            element={<AddDepartment />}
          ></Route>
          <Route
            path="/admin-dashboard/department/:id"
            element={<EditDepartment />}
          ></Route>

          {/* Employee Management Routes (Admin) */}
          <Route path="/admin-dashboard/employees" element={<List />}></Route>
          <Route path="/admin-dashboard/add-employee" element={<Add />}></Route>
          <Route
            path="/admin-dashboard/employees/:id"
            element={<View />}
          ></Route>
          <Route
            path="/admin-dashboard/employees/edit/:id"
            element={<Edit />}
          ></Route>
          <Route
            path="/admin-dashboard/employees/salary/:id"
            element={<ViewSalary />}
          ></Route>

          {/* Salary Management Routes (Admin) */}
          <Route
            path="/admin-dashboard/salary/automatic"
            element={<AutomaticSalary />}
          ></Route>

          <Route
            path="/admin-dashboard/salary/view"
            element={<SalaryView />}
          ></Route>
          <Route
            path="/admin-dashboard/salary/salaryconfig"
            element={<SalaryConfig />}
          ></Route>

          {/* Designation Management Routes (Admin) */}
          <Route
            path="/admin-dashboard/designation/add"
            element={< DesignationAdd />}
          ></Route>
          <Route
            path="/admin-dashboard/designation"
            element={< DesignationList />}
          ></Route>
          <Route
            path="/admin-dashboard/designation/edit/:id"
            element={< DesignationEdit />}
          ></Route>

          {/* Leave Setup Management Routes (Admin)*/}
          <Route
            path="/admin-dashboard/leave-Setup/add"
            element={< LeaveSeatupAdd />}
          ></Route>
          <Route
            path="/admin-dashboard/leave-Setup/edit/:id"
            element={< LeaveSeatupEdit />}
          ></Route>
          <Route
            path="/admin-dashboard/leave-Setup"
            element={< LeaveSeatupList />}
          ></Route>

          {/* Leave Management Routes (Admin)*/}
          <Route path="/admin-dashboard/leaves" element={<Table />}></Route>
          <Route path="/admin-dashboard/leaves/:id" element={<Detail />}></Route>
          <Route path="/admin-dashboard/employees/leaves/:id" element={<LeaveList />}></Route>

          {/* Leave Handover Management Routes (Admin)*/}
          <Route
            path="/admin-dashboard/leave-handover"
            element={< LeaveHandover isAdmin={true} />}
          ></Route>

          <Route path="/admin-dashboard/setting" element={<Setting />}></Route>
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
          <Route index element={<Summary />}></Route>

          <Route path="/employee-dashboard/profile/:id" element={<View />}></Route>
          <Route path="/employee-dashboard/leaves/:id" element={<LeaveList />}></Route>
          <Route path="/employee-dashboard/add-leave" element={<AddLeave />}></Route>
          <Route path="/employee-dashboard/salary/:id" element={<ViewSalary />}></Route>
          <Route path="/employee-dashboard/setting" element={<Setting />}></Route>
          <Route path="/employee-dashboard/leave-handover" element={<EmployeeLeaveHandover />}></Route>
        </Route>

        {/* Catch-all or Unauthorized Route */}
        {/* Add an unauthorized page component if you like */}
        <Route path="*" element={<Navigate to="/login" />}></Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
