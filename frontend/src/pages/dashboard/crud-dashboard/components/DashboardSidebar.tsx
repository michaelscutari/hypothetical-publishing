import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import type {} from '@mui/material/themeCssVarsAugmentation';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { matchPath, useLocation } from 'react-router-dom';
import DashboardSidebarContext from '../context/DashboardSidebarContext';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '../constants';
import DashboardSidebarPageItem from './DashboardSidebarPageItem';
import DashboardSidebarHeaderItem from './DashboardSidebarHeaderItem';
import DashboardSidebarDividerItem from './DashboardSidebarDividerItem';
import { getDrawerSxTransitionMixin, getDrawerWidthTransitionMixin } from '../mixins';
import { useAuth } from '../../../../context/AuthContext';

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
  const { logout } = useAuth();

  const { pathname } = useLocation();

  const [expandedItemIds, setExpandedItemIds] = React.useState<string[]>([]);

  const isOverSmViewport = useMediaQuery(theme.breakpoints.up('sm'));
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up('md'));

  const [isFullyExpanded, setIsFullyExpanded] = React.useState(expanded);
  const [isFullyCollapsed, setIsFullyCollapsed] = React.useState(!expanded);

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
              <DashboardSidebarHeaderItem>Main items</DashboardSidebarHeaderItem>
              <DashboardSidebarPageItem
                id="employees"
                title="Employees"
                icon={<PersonIcon />}
                href="/dashboard/employees"
                selected={
                  !!matchPath('/dashboard/employees/*', pathname) ||
                  pathname === '/dashboard' ||
                  pathname === '/dashboard/'
                }
              />
              <DashboardSidebarDividerItem />
              <DashboardSidebarHeaderItem>Example items</DashboardSidebarHeaderItem>
              <DashboardSidebarPageItem
                id="reports"
                title="Reports"
                icon={<BarChartIcon />}
                href="/dashboard/reports"
                selected={!!matchPath('/dashboard/reports', pathname)}
                defaultExpanded={!!matchPath('/dashboard/reports', pathname)}
                expanded={expandedItemIds.includes('reports')}
                nestedNavigation={
                  <List
                    dense
                    sx={{
                      padding: 0,
                      my: 1,
                      pl: mini ? 0 : 1,
                      minWidth: 240,
                    }}
                  >
                    <DashboardSidebarPageItem
                      id="sales"
                      title="Sales"
                      icon={<DescriptionIcon />}
                      href="/dashboard/reports/sales"
                      selected={!!matchPath('/dashboard/reports/sales', pathname)}
                    />
                    <DashboardSidebarPageItem
                      id="traffic"
                      title="Traffic"
                      icon={<DescriptionIcon />}
                      href="/dashboard/reports/traffic"
                      selected={!!matchPath('/dashboard/reports/traffic', pathname)}
                    />
                  </List>
                }
              />
              <DashboardSidebarPageItem
                id="integrations"
                title="Integrations"
                icon={<LayersIcon />}
                href="/dashboard/integrations"
                selected={!!matchPath('/dashboard/integrations', pathname)}
              />
            </List>
          </Box>
          <List
            dense
            sx={{
              padding: mini ? 0 : 0.5,
              width: mini ? MINI_DRAWER_WIDTH : 'auto',
            }}
          >
            <DashboardSidebarDividerItem />
            <ListItem disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={handleLogout}
                title={mini ? 'Logout' : undefined}
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
                  <LogoutOutlinedIcon fontSize="small" />
                </ListItemIcon>
                {!mini ? <ListItemText primary="Logout" /> : null}
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>
    ),
    [mini, hasDrawerTransitions, isFullyExpanded, expandedItemIds, pathname, handleLogout],
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
    };
  }, [handlePageItemClick, mini, isFullyExpanded, isFullyCollapsed, hasDrawerTransitions]);

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
