let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: (() => void) | null) {
  onUnauthorized = callback;
}

const originalFetch = window.fetch;

window.fetch = async (...args: Parameters<typeof fetch>) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    const url =
      typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
    if (url.includes('/api/') && !url.includes('/api/auth/login') && onUnauthorized) {
      onUnauthorized();
    }
  }
  return response;
};
