// src/hooks/usePreferredColorScheme.ts
import * as React from 'react';

const KEY = 'hp_color_mode'; // 'system' | 'light' | 'dark'
export type PreferredMode = 'system' | 'light' | 'dark';

export function usePreferredColorScheme() {
  const [preferred, setPreferred] = React.useState<PreferredMode>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const storage = window.localStorage;
      if (!storage || typeof storage.getItem !== 'function') return 'system';
      const raw = storage.getItem(KEY);
      return (raw as PreferredMode) ?? 'system';
    } catch {
      return 'system';
    }
  });

  const [prefersDark, setPrefersDark] = React.useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
      : false,
  );

  const effectiveMode = React.useMemo(
    () => (preferred === 'system' ? (prefersDark ? 'dark' : 'light') : preferred),
    [preferred, prefersDark],
  ) as 'light' | 'dark';

  React.useEffect(() => {
    try {
      const storage = window.localStorage;
      if (!storage || typeof storage.setItem !== 'function') return;
      storage.setItem(KEY, preferred);
    } catch {
      // Ignore localStorage errors (e.g., in private browsing or test envs)
    }
  }, [preferred]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mql.addEventListener?.('change', handler);
    if (!mql.addEventListener) mql.addListener?.(handler as (e: MediaQueryListEvent) => void);
    return () => {
      mql.removeEventListener?.('change', handler);
      if (!mql.removeEventListener)
        mql.removeListener?.(handler as (e: MediaQueryListEvent) => void);
    };
  }, []);

  const setPreferredMode = React.useCallback((m: PreferredMode) => setPreferred(m), []);

  return { preferredMode: preferred, effectiveMode, setPreferredMode };
}
