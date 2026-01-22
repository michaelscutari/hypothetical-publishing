import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/auth/login';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderLogin() {
  // Mock initial auth check as not authenticated
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
    if (url.includes('/api/auth/login')) {
      return Promise.resolve(
        new Response(null, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
    return Promise.resolve(new Response(null, { status: 200 }));
  });
  vi.stubGlobal('fetch', fetchMock);

  render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>,
  );

  return fetchMock;
}

describe('Login Page', () => {
  it('renders login form', async () => {
    renderLogin();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderLogin();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('calls login API with credentials', async () => {
    const fetchMock = renderLogin();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'admin');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const loginCall = fetchMock.mock.calls.find((call) =>
        (typeof call[0] === 'string' ? call[0] : '').includes('/api/auth/login'),
      );
      expect(loginCall).toBeDefined();
      expect(loginCall![1]).toMatchObject({
        method: 'POST',
        credentials: 'include',
      });
      expect(JSON.parse(loginCall![1].body as string)).toEqual({
        username: 'admin',
        password: 'admin',
      });
    });
  });

  it('shows error message on failed login', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            statusText: 'Unauthorized',
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      if (url.includes('/api/auth/login')) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            statusText: 'Unauthorized',
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(new Response(null, { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>,
    );

    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
