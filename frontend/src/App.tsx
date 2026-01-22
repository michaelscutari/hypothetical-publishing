import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Auth from './pages/auth';
import Dashboard from './pages/dashboard';
import ApiTest from './pages/api-test';
import ColorModeIconDropdown from './components/ColorModeIconDropdown';
import BackendStatus from './components/BackendStatus';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/" element={<Auth />} />

        {/* Protected routes */}
        <Route
          path="/dashboard/*"
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

        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BackendStatus />
    </BrowserRouter>
  );
}

export default App;
