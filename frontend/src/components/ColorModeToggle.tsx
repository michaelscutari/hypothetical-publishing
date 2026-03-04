// src/components/ColorModeToggle.tsx
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import type { IconButtonProps } from '@mui/material/IconButton';
import { useColorScheme } from '@/context/ColorSchemeContext';

export default function ColorModeToggle(props: IconButtonProps) {
  const { effectiveMode, setPreferredMode } = useColorScheme();
  const isDark = effectiveMode === 'dark';

  const handleToggle = () => {
    setPreferredMode(isDark ? 'light' : 'dark');
  };

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        aria-label="Toggle dark mode"
        onClick={handleToggle}
        size="small"
        data-screenshot="toggle-mode"
        {...props}
      >
        {isDark ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
