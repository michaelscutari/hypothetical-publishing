import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import './index.css';
import App from './App';
import { getTheme } from './theme/getTheme';
import React from 'react';
import { ColorSchemeProvider, useColorScheme } from './context/ColorSchemeContext';
import { AuthProvider } from './context/AuthContext';

// eslint-disable-next-line react-refresh/only-export-components
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

// eslint-disable-next-line react-refresh/only-export-components
function Root() {
  return (
    <ColorSchemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ColorSchemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
