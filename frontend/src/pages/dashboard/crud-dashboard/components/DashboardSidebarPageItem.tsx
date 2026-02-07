import * as React from 'react';
import { type Theme } from '@mui/material/styles';
import { type SxProps } from '@mui/system';
import Collapse from '@mui/material/Collapse';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link } from 'react-router-dom';
import DashboardSidebarContext from '../context/DashboardSidebarContext';

export interface DashboardSidebarPageItemProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  href: string;
  action?: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  nestedNavigation?: React.ReactNode;
}

export default function DashboardSidebarPageItem({
  id,
  title,
  icon,
  href,
  action,
  defaultExpanded = false,
  expanded = defaultExpanded,
  selected = false,
  disabled = false,
  nestedNavigation,
}: DashboardSidebarPageItemProps) {
  const sidebarContext = React.useContext(DashboardSidebarContext);
  if (!sidebarContext) {
    throw new Error('Sidebar context was used without a provider.');
  }
  const { onPageItemClick } = sidebarContext;

  const handleClick = React.useCallback(() => {
    if (onPageItemClick) {
      onPageItemClick(id, !!nestedNavigation);
    }
  }, [onPageItemClick, id, nestedNavigation]);

  const nestedNavigationCollapseSx: SxProps<Theme> = {
    ml: 0.5,
    fontSize: 20,
    transform: `rotate(${expanded ? 0 : -90}deg)`,
    transition: (theme: Theme) =>
      theme.transitions.create('transform', {
        easing: theme.transitions.easing.sharp,
        duration: 100,
      }),
  };

  const hasExternalHref = href ? href.startsWith('http://') || href.startsWith('https://') : false;

  const LinkComponent = hasExternalHref ? 'a' : Link;

  return (
    <React.Fragment>
      <ListItem
        disablePadding
        sx={{
          display: 'block',
          py: 0,
          px: 1,
          overflowX: 'hidden',
        }}
      >
        <ListItemButton
          selected={selected}
          disabled={disabled}
          {...(nestedNavigation
            ? {
                onClick: handleClick,
              }
            : {})}
          {...(!nestedNavigation
            ? {
                LinkComponent,
                ...(hasExternalHref
                  ? {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    }
                  : {}),
                to: href,
                onClick: handleClick,
              }
            : {})}
        >
          {icon ? (
            <ListItemIcon
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {icon}
            </ListItemIcon>
          ) : null}
          <ListItemText
            primary={title}
            sx={{
              whiteSpace: 'nowrap',
              zIndex: 1,
            }}
          />
          {action ? action : null}
          {nestedNavigation ? <ExpandMoreIcon sx={nestedNavigationCollapseSx} /> : null}
        </ListItemButton>
      </ListItem>
      {nestedNavigation ? (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {nestedNavigation}
        </Collapse>
      ) : null}
    </React.Fragment>
  );
}
