// src/hooks/usePreferredColorScheme.ts
import { useEffect, useMemo, useState, useCallback } from 'react';

const KEY = 'hp_color_mode'; // 'system' | 'light' | 'dark'
export type PreferredMode = 'system' | 'light' | 'dark';

export function usePreferredColorScheme() {
  const [preferred, setPreferred] = useState<PreferredMode>(() => {
    if (typeof window === 'undefined') return 'system';
    const raw = localStorage.getItem(KEY);
    return (raw as PreferredMode) ?? 'system';
  });

  const [prefersDark, setPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
      : false,
  );

  const effectiveMode = useMemo(
    () => (preferred === 'system' ? (prefersDark ? 'dark' : 'light') : preferred),
    [preferred, prefersDark],
  ) as 'light' | 'dark';

  useEffect(() => {
    try {
      localStorage.setItem(KEY, preferred);
    } catch {
      // Ignore localStorage errors (e.g., in private browsing)
    }
  }, [preferred]);

  useEffect(() => {
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

  const setPreferredMode = useCallback((m: PreferredMode) => setPreferred(m), []);

  return { preferredMode: preferred, effectiveMode, setPreferredMode };
}
