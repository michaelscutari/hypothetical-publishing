import { afterEach, describe, expect, it, vi } from 'vitest';
import createClient from 'openapi-fetch';
import type { paths } from '../../api/schema';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('calls the correct endpoint and parses response', async () => {
    const mockResponse = { status: 'UP' };
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = createClient<paths>({ baseUrl: 'http://localhost' });
    const { data, error } = await api.GET('/api/health');

    expect(error).toBeUndefined();
    expect(data).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect((fetchMock.mock.calls[0][0] as Request).url).toContain('/api/health');
  });

  it('returns error on non-2xx response', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = createClient<paths>({ baseUrl: 'http://localhost' });
    const { data, error } = await api.GET('/api/health');

    expect(data).toBeUndefined();
    expect(error).toBeDefined();
  });
});
