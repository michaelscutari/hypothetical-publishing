import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BackendStatus from '../../components/BackendStatus';

const STATUS_COLORS = {
  checking: 'rgb(234, 179, 8)',
  connected: 'rgb(34, 197, 94)',
  error: 'rgb(239, 68, 68)',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('BackendStatus', () => {
  it('renders with checking state initially', () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);

    render(<BackendStatus />);

    const indicator = screen.getByLabelText('Checking backend...');
    expect(indicator).toBeInTheDocument();
    expect(getComputedStyle(indicator).backgroundColor).toBe(STATUS_COLORS.checking);
    expect(fetchMock).toHaveBeenCalledWith('/api/health');
  });

  it('shows connected when health returns OK', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true } as Response));
    vi.stubGlobal('fetch', fetchMock);

    render(<BackendStatus />);

    const indicator = await screen.findByLabelText('Backend connected');
    expect(getComputedStyle(indicator).backgroundColor).toBe(STATUS_COLORS.connected);
    expect(fetchMock).toHaveBeenCalledWith('/api/health');
  });

  it('shows error when health fails', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('Network error')));
    vi.stubGlobal('fetch', fetchMock);

    render(<BackendStatus />);

    const indicator = await screen.findByLabelText('Backend unavailable');
    expect(getComputedStyle(indicator).backgroundColor).toBe(STATUS_COLORS.error);
    expect(fetchMock).toHaveBeenCalledWith('/api/health');
  });
});
