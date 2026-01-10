// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import './index.css';
import App from './App';
import { getTheme } from './theme/getTheme';
import React from 'react';
import { ColorSchemeProvider, useColorScheme } from './context/ColorSchemeContext';

function ThemedApp() {
  const { effectiveMode } = useColorScheme();
  const theme = React.useMemo(() => getTheme(effectiveMode), [effectiveMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <App />
    </ThemeProvider>
  );
}

function Root() {
  return (
    <ColorSchemeProvider>
      <ThemedApp />
    </ColorSchemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
