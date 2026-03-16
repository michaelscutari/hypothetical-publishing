import * as React from 'react';

/**
 * Debounces a string value by the given delay.
 * Returns the debounced value and a `flush` function that immediately
 * applies the current value (useful for Enter-key-to-search patterns).
 * Pass an explicit value to `flush` when the latest React state hasn't
 * rendered yet (e.g. calling flush right after setState in the same handler).
 */
export function useDebounce(value: string, delay: number): [string, (override?: string) => void] {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  const timerRef = React.useRef<number | null>(null);
  const latestValue = React.useRef(value);

  React.useEffect(() => {
    latestValue.current = value;
  });

  React.useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setDebouncedValue(value.trim());
    }, delay);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  const flush = React.useCallback((override?: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setDebouncedValue(override !== undefined ? override.trim() : latestValue.current.trim());
  }, []);

  return [debouncedValue, flush];
}
