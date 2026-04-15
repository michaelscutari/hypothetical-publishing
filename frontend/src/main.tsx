import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from '@/App';
import { getTheme } from '@/theme/getTheme';
import { ColorSchemeProvider, useColorScheme } from '@/context/ColorSchemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { BrandingProvider } from '@/branding/BrandingContext';

// eslint-disable-next-line react-refresh/only-export-components
function Root() {
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
function Providers() {
  return (
    <BrandingProvider>
      <ColorSchemeProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ColorSchemeProvider>
    </BrandingProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers />
  </React.StrictMode>,
);
