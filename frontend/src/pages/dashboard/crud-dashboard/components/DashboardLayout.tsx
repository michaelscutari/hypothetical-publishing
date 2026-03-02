import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <DashboardHeader />
      <Box
        component="main"
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'background.default' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
