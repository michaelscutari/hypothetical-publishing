import * as React from 'react';
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import ColorModeIconDropdown from '../../../../components/ColorModeIconDropdown';

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: 'solid',
  borderColor: (theme.vars ?? theme).palette.divider,
  boxShadow: 'none',
}));

const NAV_ITEMS = [
  { label: 'Books', path: '/books', pattern: '/books/*' },
  { label: 'Sales Records', path: '/sales', pattern: '/sales/*' },
  { label: 'Author Payments', path: '/author-payments', pattern: '/author-payments' },
] as const;

function useActiveTab() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '') return 0;
  const idx = NAV_ITEMS.findIndex((item) => matchPath(item.pattern, pathname));
  return idx === -1 ? 0 : idx;
}

export default function DashboardHeader() {
  const activeTab = useActiveTab();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleProfileClick = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  }, []);

  const handleProfileClose = React.useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleChangePassword = React.useCallback(() => {
    setAnchorEl(null);
    navigate('/change-password');
  }, [navigate]);

  const handleLogout = React.useCallback(() => {
    setAnchorEl(null);
    void logout();
  }, [logout]);

  return (
    <AppBar color="inherit" position="static" sx={{ displayPrint: 'none' }}>
      <Toolbar sx={{ backgroundColor: 'inherit', gap: 2 }}>
        <Tabs value={activeTab} sx={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <Tab
              key={item.path}
              label={item.label}
              component={Link}
              to={item.path}
            />
          ))}
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ColorModeIconDropdown />
          <IconButton onClick={handleProfileClick} color="inherit" aria-label="profile menu">
            <AccountCircleIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
