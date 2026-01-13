import NotificationsProvider from './hooks/useNotifications/NotificationsProvider';
import DialogsProvider from './hooks/useDialogs/DialogsProvider';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import EmployeeList from './components/EmployeeList';
import EmployeeShow from './components/EmployeeShow';
import EmployeeCreate from './components/EmployeeCreate';
import EmployeeEdit from './components/EmployeeEdit';

export default function CrudDashboard() {
  return (
    <NotificationsProvider>
      <DialogsProvider>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<EmployeeList />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/new" element={<EmployeeCreate />} />
            <Route path="employees/:employeeId" element={<EmployeeShow />} />
            <Route path="employees/:employeeId/edit" element={<EmployeeEdit />} />
          </Route>
        </Routes>
      </DialogsProvider>
    </NotificationsProvider>
  );
}
