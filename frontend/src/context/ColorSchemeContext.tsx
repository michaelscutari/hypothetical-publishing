import * as React from 'react';
import type { PreferredMode } from '../hooks/usePreferredColorScheme';
import { usePreferredColorScheme } from '../hooks/usePreferredColorScheme';

type ColorSchemeContextValue = {
  preferredMode: PreferredMode;
  effectiveMode: 'light' | 'dark';
  setPreferredMode: (mode: PreferredMode) => void;
};

const ColorSchemeContext = React.createContext<ColorSchemeContextValue | undefined>(undefined);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const value = usePreferredColorScheme();
  return <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useColorScheme() {
  const context = React.useContext(ColorSchemeContext);
  if (!context) {
    throw new Error('useColorScheme must be used within a ColorSchemeProvider');
  }
  return context;
}
