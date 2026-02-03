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
import type {} from '@mui/material/themeCssVarsAugmentation';
import useMediaQuery from '@mui/material/useMediaQuery';
import * as React from 'react';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { matchPath, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../../context/AuthContext';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '../constants';
import DashboardSidebarContext from '../context/DashboardSidebarContext';
import { getDrawerSxTransitionMixin, getDrawerWidthTransitionMixin } from '../mixins';
import DashboardSidebarDividerItem from './DashboardSidebarDividerItem';
import DashboardSidebarPageItem from './DashboardSidebarPageItem';

export interface DashboardSidebarProps {
  expanded?: boolean;
  setExpanded: (expanded: boolean) => void;
  disableCollapsibleSidebar?: boolean;
  container?: Element;
}

export default function DashboardSidebar({
  expanded = true,
  setExpanded,
  disableCollapsibleSidebar = false,
  container,
}: DashboardSidebarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { pathname } = useLocation();

  const [expandedItemIds, setExpandedItemIds] = React.useState<string[]>([]);

  const isOverSmViewport = useMediaQuery(theme.breakpoints.up('sm'));
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up('md'));

  const [isFullyExpanded, setIsFullyExpanded] = React.useState(expanded);
  const [isFullyCollapsed, setIsFullyCollapsed] = React.useState(!expanded);

  // Profile menu state
  const [profileAnchorEl, setProfileAnchorEl] = React.useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileAnchorEl);

  React.useEffect(() => {
    if (expanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyExpanded(true);
      }, theme.transitions.duration.enteringScreen);

      return () => clearTimeout(drawerWidthTransitionTimeout);
    }

    setIsFullyExpanded(false);

    return () => {};
  }, [expanded, theme.transitions.duration.enteringScreen]);

  React.useEffect(() => {
    if (!expanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyCollapsed(true);
      }, theme.transitions.duration.leavingScreen);

      return () => clearTimeout(drawerWidthTransitionTimeout);
    }

    setIsFullyCollapsed(false);

    return () => {};
  }, [expanded, theme.transitions.duration.leavingScreen]);

  const mini = !disableCollapsibleSidebar && !expanded;

  const handleSetSidebarExpanded = React.useCallback(
    (newExpanded: boolean) => () => {
      setExpanded(newExpanded);
    },
    [setExpanded],
  );

  const handlePageItemClick = React.useCallback(
    (itemId: string, hasNestedNavigation: boolean) => {
      if (hasNestedNavigation && !mini) {
        setExpandedItemIds((previousValue) =>
          previousValue.includes(itemId)
            ? previousValue.filter((previousValueItemId) => previousValueItemId !== itemId)
            : [...previousValue, itemId],
        );
      } else if (!isOverSmViewport && !hasNestedNavigation) {
        setExpanded(false);
      }
    },
    [mini, setExpanded, isOverSmViewport],
  );

  const handleLogout = React.useCallback(() => {
    void logout();
    if (!isOverSmViewport) {
      setExpanded(false);
    }
  }, [logout, isOverSmViewport, setExpanded]);

  // Profile menu handlers
  const handleProfileClick = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  }, []);

  const handleProfileClose = React.useCallback(() => {
    setProfileAnchorEl(null);
  }, []);

  const handleChangePassword = React.useCallback(() => {
    setProfileAnchorEl(null);
    navigate('/dashboard/change-password');
    if (!isOverSmViewport) {
      setExpanded(false);
    }
  }, [navigate, isOverSmViewport, setExpanded]);

  const handleLogoutFromMenu = React.useCallback(() => {
    setProfileAnchorEl(null);
    handleLogout();
  }, [handleLogout]);

  const hasDrawerTransitions = isOverSmViewport && (!disableCollapsibleSidebar || isOverMdViewport);

  const getDrawerContent = React.useCallback(
    (viewport: 'phone' | 'tablet' | 'desktop') => (
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
            pt: !mini ? 0 : 2,
            ...(hasDrawerTransitions ? getDrawerSxTransitionMixin(isFullyExpanded, 'padding') : {}),
          }}
        >
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarGutter: mini ? 'stable' : 'auto',
            }}
          >
            <List
              dense
              sx={{
                padding: mini ? 0 : 0.5,
                mb: 4,
                width: mini ? MINI_DRAWER_WIDTH : 'auto',
              }}
            >
              <DashboardSidebarPageItem
                id="books"
                title="Books"
                icon={<MenuBookIcon />}
                href="/dashboard/books"
                selected={
                  !!matchPath('/dashboard/books/*', pathname) ||
                  pathname === '/dashboard' ||
                  pathname === '/dashboard/'
                }
              />
              <DashboardSidebarPageItem
                id="sales"
                title="Sales Records"
                icon={<ReceiptIcon />}
                href="/dashboard/sales"
                selected={!!matchPath('/dashboard/sales/*', pathname)}
              />
              <DashboardSidebarPageItem
                id="author-payments"
                title="Author Payments"
                icon={<AccountBalanceWalletIcon />}
                href="/dashboard/author-payments"
                selected={!!matchPath('/dashboard/author-payments', pathname)}
              />
              <DashboardSidebarDividerItem />
            </List>
          </Box>

          {/* Bottom section */}
          <List
            dense
            sx={{
              padding: mini ? 0 : 0.5,
              width: mini ? MINI_DRAWER_WIDTH : 'auto',
            }}
          >
            <DashboardSidebarDividerItem />

            {/* Profile button */}
            <ListItem disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={handleProfileClick}
                title={mini ? 'Profile' : undefined}
                sx={{
                  height: mini ? 50 : 'auto',
                  justifyContent: mini ? 'center' : 'flex-start',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: mini ? 'auto' : 40,
                    justifyContent: 'center',
                  }}
                >
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                {!mini ? <ListItemText primary="Profile" /> : null}
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
      mini,
      hasDrawerTransitions,
      isFullyExpanded,
      pathname,
      handleProfileClick,
      handleProfileClose,
      profileAnchorEl,
      profileMenuOpen,
      handleChangePassword,
      handleLogoutFromMenu,
    ],
  );

  const getDrawerSharedSx = React.useCallback(
    (isTemporary: boolean) => {
      const drawerWidth = mini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;

      return {
        displayPrint: 'none',
        width: drawerWidth,
        height: '100%',
        flexShrink: 0,
        ...getDrawerWidthTransitionMixin(expanded),
        ...(isTemporary ? { position: 'absolute' } : {}),
        [`& .MuiDrawer-paper`]: {
          position: 'absolute',
          width: drawerWidth,
          height: '100%',
          top: 0,
          bottom: 0,
          boxSizing: 'border-box',
          backgroundImage: 'none',
          ...getDrawerWidthTransitionMixin(expanded),
        },
      };
    },
    [expanded, mini],
  );

  const sidebarContextValue = React.useMemo(() => {
    return {
      onPageItemClick: handlePageItemClick,
      mini,
      fullyExpanded: isFullyExpanded,
      fullyCollapsed: isFullyCollapsed,
      hasDrawerTransitions,
      expandedItemIds, // expose current expanded ids
      toggleExpandedItemId: (id: string) =>
        setExpandedItemIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        ),
    };
  }, [
    handlePageItemClick,
    mini,
    isFullyExpanded,
    isFullyCollapsed,
    hasDrawerTransitions,
    expandedItemIds,
  ]);

  return (
    <DashboardSidebarContext.Provider value={sidebarContextValue}>
      <Drawer
        container={container}
        variant="temporary"
        open={expanded}
        onClose={handleSetSidebarExpanded(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: {
            xs: 'block',
            sm: disableCollapsibleSidebar ? 'block' : 'none',
            md: 'none',
          },
          ...getDrawerSharedSx(true),
        }}
      >
        {getDrawerContent('phone')}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: {
            xs: 'none',
            sm: disableCollapsibleSidebar ? 'none' : 'block',
            md: 'none',
          },
          ...getDrawerSharedSx(false),
        }}
      >
        {getDrawerContent('tablet')}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          ...getDrawerSharedSx(false),
        }}
      >
        {getDrawerContent('desktop')}
      </Drawer>
    </DashboardSidebarContext.Provider>
  );
}
