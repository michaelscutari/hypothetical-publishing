// src/components/ColorModeIconDropdown.tsx
import * as React from 'react';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import type { IconButtonProps } from '@mui/material/IconButton';
import { useColorScheme } from '../context/ColorSchemeContext';

export default function ColorModeIconDropdown(props: IconButtonProps) {
  const { preferredMode, effectiveMode, setPreferredMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => {
    anchorEl?.blur();
    setAnchorEl(null);
  };
  const handleMode = (m: 'system' | 'light' | 'dark') => () => {
    setPreferredMode(m);
    handleClose();
  };

  const icon = effectiveMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />;

  return (
    <React.Fragment>
      <Tooltip title="Theme">
        <IconButton
          aria-label="Choose color scheme"
          onClick={handleClick}
          size="small"
          data-screenshot="toggle-mode"
          {...props}
        >
          {icon}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ variant: 'outlined', elevation: 0, sx: { my: '4px' } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem selected={preferredMode === 'system'} onClick={handleMode('system')}>
          System
        </MenuItem>
        <MenuItem selected={preferredMode === 'light'} onClick={handleMode('light')}>
          Light
        </MenuItem>
        <MenuItem selected={preferredMode === 'dark'} onClick={handleMode('dark')}>
          Dark
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
}
