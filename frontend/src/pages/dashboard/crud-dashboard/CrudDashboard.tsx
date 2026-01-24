import NotificationsProvider from './hooks/useNotifications/NotificationsProvider';
import DialogsProvider from './hooks/useDialogs/DialogsProvider';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import BookList from './components/BookList';
import BookShow from './components/BookShow';
import BookCreate from './components/BookCreate';
import BookEdit from './components/BookEdit';
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
            <Route index element={<BookList />} />
            <Route path="books" element={<BookList />} />
            <Route path="books/new" element={<BookCreate />} />
            <Route path="books/:bookId" element={<BookShow />} />
            <Route path="books/:bookId/edit" element={<BookEdit />} />
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
