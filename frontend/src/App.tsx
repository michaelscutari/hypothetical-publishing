import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ApiTest from './pages/api-test';
import Auth from './pages/auth';
import Dashboard from './pages/dashboard';
import NotificationsProvider from './pages/dashboard/crud-dashboard/hooks/useNotifications/NotificationsProvider';

function App() {
  return (
    <BrowserRouter>
      <NotificationsProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Auth />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-test"
            element={
              <ProtectedRoute>
                <ApiTest />
              </ProtectedRoute>
            }
          />
        </Routes>
      </NotificationsProvider>
    </BrowserRouter>
  );
}

export default App;
