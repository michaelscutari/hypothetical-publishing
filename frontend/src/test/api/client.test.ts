import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, OpenAPI, SystemService } from '@/api';

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

    OpenAPI.BASE = 'http://localhost';
    const data = await SystemService.getHealth();

    expect(data).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0][0] as Request | string;
    const url = typeof request === 'string' ? request : request.url;
    expect(url).toContain('/api/health');
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

    OpenAPI.BASE = 'http://localhost';
    await expect(SystemService.getHealth()).rejects.toBeInstanceOf(ApiError);
  });
});
