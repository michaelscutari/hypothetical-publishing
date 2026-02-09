import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            background: {
              default: '#f0f2f5',
              paper: '#ffffff',
            },
            divider: '#dce0e5',
          }
        : {}),
    },
  });
