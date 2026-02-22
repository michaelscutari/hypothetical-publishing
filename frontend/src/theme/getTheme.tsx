import { createTheme } from '@mui/material/styles';

// Light: warm parchment/papyrus with dark ink
// Dark: deep charcoal-sepia with aged paper tones
export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#3b2f1e', light: '#5c4a34', dark: '#261e12' },
            secondary: { main: '#7a5c3a' },
            background: {
              default: '#f0e8dc',
              paper: '#faf6ef',
            },
            text: {
              primary: '#2b2318',
              secondary: '#6b5d4f',
            },
            divider: '#a0906e',
          }
        : {
            primary: { main: '#d4b896', light: '#e2ccb0', dark: '#b89a72' },
            secondary: { main: '#b89a72' },
            background: {
              default: '#1a1612',
              paper: '#252019',
            },
            text: {
              primary: '#e8dfd4',
              secondary: '#a89882',
            },
            divider: '#3d352a',
          }),
    },
    typography: {
      fontFamily: '"Atkinson Hyperlegible", "Helvetica", "Arial", sans-serif',
    },
  });
