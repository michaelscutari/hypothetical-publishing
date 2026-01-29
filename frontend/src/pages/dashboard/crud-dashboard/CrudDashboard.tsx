import { Route, Routes } from 'react-router-dom';
import BookCreate from './components/BookCreate';
import BookEdit from './components/BookEdit';
import BookList from './components/BookList';
import BookShow from './components/BookShow';
import ChangePassword from './components/ChangePassword';
import DashboardLayout from './components/DashboardLayout';
import EmployeeCreate from './components/EmployeeCreate';
import EmployeeEdit from './components/EmployeeEdit';
import EmployeeList from './components/EmployeeList';
import EmployeeShow from './components/EmployeeShow';
import DialogsProvider from './hooks/useDialogs/DialogsProvider';
import NotificationsProvider from './hooks/useNotifications/NotificationsProvider';
import SaleList from './components/SaleList';
import SaleCreate from './components/SaleCreate';
import SaleShow from './components/SaleShow';
import SaleEdit from './components/SaleEdit';

export default function CrudDashboard() {
  return (
    <NotificationsProvider>
      <DialogsProvider>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<BookList />} />
            <Route path="books" element={<BookList />} />
            <Route path="books/new" element={<BookCreate />} />
            <Route path="books/:bookId" element={<BookShow />} />
            <Route path="books/:bookId/edit" element={<BookEdit />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/new" element={<EmployeeCreate />} />
            <Route path="employees/:employeeId" element={<EmployeeShow />} />
            <Route path="employees/:employeeId/edit" element={<EmployeeEdit />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="sales" element={<SaleList />} />
            <Route path="sales/new" element={<SaleCreate />} />
            <Route path="sales/:saleId" element={<SaleShow />} />
            <Route path="sales/:saleId/edit" element={<SaleEdit />} />
          </Route>
        </Routes>
      </DialogsProvider>
    </NotificationsProvider>
  );
}
