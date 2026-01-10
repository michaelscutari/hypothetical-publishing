import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Auth from './pages/auth';
import Dashboard from './pages/dashboard';
import ColorModeIconDropdown from './components/ColorModeIconDropdown';

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
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
