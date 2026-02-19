import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import Auth from './pages/auth';
import Dashboard from './pages/dashboard';
import ApiTest from './pages/api-test';
import ColorModeIconDropdown from './components/ColorModeIconDropdown';
import BackendStatus from './components/BackendStatus';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationsProvider from './pages/dashboard/crud-dashboard/hooks/useNotifications/NotificationsProvider';

function App() {
  return (
    <BrowserRouter>
      <NotificationsProvider>
        <Box
          sx={(theme) => ({
            position: 'fixed',
            top: theme.spacing(2),
            right: theme.spacing(2),
            zIndex: theme.zIndex.tooltip,
          })}
        >
          <ColorModeIconDropdown size="small" />
        </Box>
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
        <BackendStatus />
      </NotificationsProvider>
    </BrowserRouter>
  );
}

export default App;
