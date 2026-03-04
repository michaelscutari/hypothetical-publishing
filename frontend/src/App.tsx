import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthorCreate from '@/features/authors/AuthorCreate';
import AuthorEdit from '@/features/authors/AuthorEdit';
import AuthorList from '@/features/authors/AuthorList';
import AuthorPayments from '@/features/authors/AuthorPayments';
import AuthorRoyaltyReport from '@/features/authors/AuthorRoyaltyReport';
import AuthorRoyaltyReportView from '@/features/authors/AuthorRoyaltyReportView';
import AuthorShow from '@/features/authors/AuthorShow';
import ChangePassword from '@/features/auth/ChangePassword';
import Login from '@/features/auth/Login';
import BookCreate from '@/features/books/BookCreate';
import BookEdit from '@/features/books/BookEdit';
import BookList from '@/features/books/BookList';
import BookShow from '@/features/books/BookShow';
import SaleCreate from '@/features/sales/SaleCreate';
import SaleEdit from '@/features/sales/SaleEdit';
import SaleImport from '@/features/sales/SaleImport';
import SaleList from '@/features/sales/SaleList';
import SaleShow from '@/features/sales/SaleShow';
import DialogsProvider from '@/hooks/useDialogs/DialogsProvider';
import NotificationsProvider from '@/hooks/useNotifications/NotificationsProvider';

function App() {
  return (
    <BrowserRouter>
      <NotificationsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
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
                      <Route path="author-payments" element={<AuthorPayments />} />
                      <Route path="authors" element={<AuthorList />} />
                      <Route path="authors/new" element={<AuthorCreate />} />
                      <Route path="authors/:authorId" element={<AuthorShow />} />
                      <Route path="authors/:authorId/edit" element={<AuthorEdit />} />
                      <Route path="reports/author-royalty" element={<AuthorRoyaltyReport />} />
                    </Route>
                    <Route path="author-royalty-report" element={<AuthorRoyaltyReportView />} />
                  </Routes>
                </DialogsProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </NotificationsProvider>
    </BrowserRouter>
  );
}

export default App;
