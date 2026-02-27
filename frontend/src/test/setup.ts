import '@testing-library/jest-dom';

// Ensure localStorage exists in jsdom even when Node is started with
// a bad --localstorage-file flag.
if (typeof window !== 'undefined') {
  const ls = window.localStorage as unknown;
  const hasGetItem = typeof (ls as { getItem?: unknown })?.getItem === 'function';
  if (!hasGetItem) {
    let store: Record<string, string> = {};
    const mock: Storage = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    };
    Object.defineProperty(window, 'localStorage', {
      value: mock,
      configurable: true,
      writable: true,
    });
  }
}
