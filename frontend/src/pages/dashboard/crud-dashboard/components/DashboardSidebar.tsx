import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import * as React from 'react';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { matchPath, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../../context/AuthContext';
import { DRAWER_WIDTH } from '../constants';
import DashboardSidebarContext from '../context/DashboardSidebarContext';
import DashboardSidebarDividerItem from './DashboardSidebarDividerItem';
import DashboardSidebarPageItem from './DashboardSidebarPageItem';

export interface DashboardSidebarProps {
  container?: Element;
}

export default function DashboardSidebar({ container }: DashboardSidebarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { pathname } = useLocation();

  const isOverSmViewport = useMediaQuery(theme.breakpoints.up('sm'));

  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Profile menu state
  const [profileAnchorEl, setProfileAnchorEl] = React.useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileAnchorEl);

  const handlePageItemClick = React.useCallback(() => {
    if (!isOverSmViewport) {
      setMobileOpen(false);
    }
  }, [isOverSmViewport]);

  const handleLogout = React.useCallback(() => {
    void logout();
    if (!isOverSmViewport) {
      setMobileOpen(false);
    }
  }, [logout, isOverSmViewport]);

  // Profile menu handlers
  const handleProfileClick = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  }, []);

  const handleProfileClose = React.useCallback(() => {
    setProfileAnchorEl(null);
  }, []);

  const handleChangePassword = React.useCallback(() => {
    setProfileAnchorEl(null);
    navigate('/change-password');
    if (!isOverSmViewport) {
      setMobileOpen(false);
    }
  }, [navigate, isOverSmViewport]);

  const handleLogoutFromMenu = React.useCallback(() => {
    setProfileAnchorEl(null);
    handleLogout();
  }, [handleLogout]);

  const getDrawerContent = React.useCallback(
    (viewport: 'phone' | 'desktop') => (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Toolbar />
        <Box
          component="nav"
          aria-label={`${viewport.charAt(0).toUpperCase()}${viewport.slice(1)}`}
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            <List
              dense
              sx={{
                padding: 0.5,
                mb: 4,
              }}
            >
              <DashboardSidebarPageItem
                id="books"
                title="Books"
                icon={<MenuBookIcon />}
                href="/books"
                selected={!!matchPath('/books/*', pathname) || pathname === '/' || pathname === ''}
              />
              <DashboardSidebarPageItem
                id="authors"
                title="Authors"
                icon={<PeopleIcon />}
                href="/authors"
                selected={!!matchPath('/authors/*', pathname)}
              />
              <DashboardSidebarPageItem
                id="sales"
                title="Sales Records"
                icon={<ReceiptIcon />}
                href="/sales"
                selected={!!matchPath('/sales/*', pathname)}
              />
              <DashboardSidebarPageItem
                id="author-payments"
                title="Author Payments"
                icon={<AccountBalanceWalletIcon />}
                href="/author-payments"
                selected={!!matchPath('/author-payments', pathname)}
              />
              <DashboardSidebarDividerItem />
            </List>
          </Box>

          {/* Bottom section */}
          <List
            dense
            sx={{
              padding: 0.5,
            }}
          >
            <DashboardSidebarDividerItem />

            {/* Profile button */}
            <ListItem disablePadding sx={{ px: 1 }}>
              <ListItemButton onClick={handleProfileClick}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
          </List>

          {/* Profile menu popover */}
          <Menu
            anchorEl={profileAnchorEl}
            open={profileMenuOpen}
            onClose={handleProfileClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
            <MenuItem onClick={handleLogoutFromMenu}>Logout</MenuItem>
          </Menu>
        </Box>
      </Box>
    ),
    [
      pathname,
      handleProfileClick,
      handleProfileClose,
      profileAnchorEl,
      profileMenuOpen,
      handleChangePassword,
      handleLogoutFromMenu,
    ],
  );

  const drawerSx = {
    displayPrint: 'none',
    width: DRAWER_WIDTH,
    height: '100%',
    flexShrink: 0,
    [`& .MuiDrawer-paper`]: {
      position: 'absolute' as const,
      width: DRAWER_WIDTH,
      height: '100%',
      top: 0,
      bottom: 0,
      boxSizing: 'border-box',
      backgroundImage: 'none',
    },
  };

  const sidebarContextValue = React.useMemo(() => {
    return {
      onPageItemClick: handlePageItemClick,
    };
  }, [handlePageItemClick]);

  return (
    <DashboardSidebarContext.Provider value={sidebarContextValue}>
      {/* Mobile temporary drawer */}
      <Drawer
        container={container}
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: 'block',
            md: 'none',
          },
          ...drawerSx,
          position: 'absolute',
        }}
      >
        {getDrawerContent('phone')}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          ...drawerSx,
        }}
      >
        {getDrawerContent('desktop')}
      </Drawer>
    </DashboardSidebarContext.Provider>
  );
}
