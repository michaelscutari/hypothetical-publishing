import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
import * as React from 'react';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';
import ColorModeIconDropdown from '../../../../components/ColorModeIconDropdown';
import { useAuth } from '../../../../context/AuthContext';

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: 'solid',
  borderColor: (theme.vars ?? theme).palette.divider,
  backgroundColor: (theme.vars ?? theme).palette.background.paper,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 8px 0 rgba(0,0,0,0.4)'
      : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
}));

const NAV_ITEMS = [
  { label: 'Books', path: '/books', pattern: '/books/*' },
  { label: 'Sales Records', path: '/sales', pattern: '/sales/*' },
  { label: 'Authors', path: '/authors', pattern: '/authors/*' },
  { label: 'Author Payments', path: '/author-payments', pattern: '/author-payments' },
  { label: 'Reports', path: '/reports/author-royalty', pattern: '/reports/*' },
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
            <Tab key={item.path} label={item.label} component={Link} to={item.path} />
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
