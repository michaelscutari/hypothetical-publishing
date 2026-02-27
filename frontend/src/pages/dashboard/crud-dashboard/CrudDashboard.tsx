import { Navigate, Route, Routes } from 'react-router-dom';
import BookCreate from './components/BookCreate';
import BookEdit from './components/BookEdit';
import BookList from './components/BookList';
import BookShow from './components/BookShow';
import ChangePassword from './components/ChangePassword';
import DashboardLayout from './components/DashboardLayout';
import DialogsProvider from './hooks/useDialogs/DialogsProvider';
import SaleList from './components/SaleList';
import SaleCreate from './components/SaleCreate';
import SaleShow from './components/SaleShow';
import SaleEdit from './components/SaleEdit';
import SaleImport from './components/SaleImport';
import AuthorPaymentsView from './components/AuthorPayments';
import AuthorCreate from './components/AuthorCreate';
import AuthorEdit from './components/AuthorEdit';
import AuthorList from './components/AuthorList';
import AuthorShow from './components/AuthorShow';

export default function CrudDashboard() {
  return (
    <DialogsProvider>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<BookList />} />
          <Route path="books" element={<BookList />} />
          <Route path="books/new" element={<BookCreate />} />
          <Route path="books/:bookId" element={<BookShow />} />
          <Route path="books/:bookId/edit" element={<BookEdit />} />
          <Route path="change-password" element={<ChangePassword />} />

          <Route path="*" element={<Navigate to="/books" replace />} />
          <Route path="sales" element={<SaleList />} />
          <Route path="sales/new" element={<SaleCreate />} />
          <Route path="sales/import" element={<SaleImport />} />
          <Route path="sales/:saleId" element={<SaleShow />} />
          <Route path="sales/:saleId/edit" element={<SaleEdit />} />
          <Route path="author-payments" element={<AuthorPaymentsView />} />
          <Route path="authors" element={<AuthorList />} />
          <Route path="authors/new" element={<AuthorCreate />} />
          <Route path="authors/:authorId" element={<AuthorShow />} />
          <Route path="authors/:authorId/edit" element={<AuthorEdit />} />
        </Route>
      </Routes>
    </DialogsProvider>
  );
}
