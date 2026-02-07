import * as React from 'react';
import ListSubheader from '@mui/material/ListSubheader';
import { DRAWER_WIDTH } from '../constants';

export interface DashboardSidebarHeaderItemProps {
  children?: React.ReactNode;
}

export default function DashboardSidebarHeaderItem({ children }: DashboardSidebarHeaderItemProps) {
  return (
    <ListSubheader
      sx={{
        fontSize: 12,
        fontWeight: '600',
        height: 36,
        px: 1.5,
        py: 0,
        minWidth: DRAWER_WIDTH,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        zIndex: 2,
      }}
    >
      {children}
    </ListSubheader>
  );
}
