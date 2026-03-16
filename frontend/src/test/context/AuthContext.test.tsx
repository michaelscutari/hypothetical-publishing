import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/context/AuthContext';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Test component that exposes auth state
function AuthStateDisplay() {
  const { isAuthenticated, isLoading, username } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isLoading.toString()}</span>
      <span data-testid="authenticated">{isAuthenticated.toString()}</span>
      <span data-testid="username">{username ?? 'null'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  it('starts in loading state', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );

    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('sets authenticated when /me returns ok', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve({ username: 'admin' }),
      } as Response),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('admin');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.any(Object));
  });

  it('sets not authenticated when /me returns 401', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('username').textContent).toBe('null');
  });

  it('sets not authenticated when /me fetch fails', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('Network error')));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });
});
