import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchApi } from '@/lib/http/client';

describe('client API requests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('throws the API error message for non-success responses', async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: '请求参数无效' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(fetchApi('/api/example')).rejects.toThrow('请求参数无效');
  });

  it('forwards the caller abort signal', async () => {
    const controller = new AbortController();
    vi.mocked(global.fetch).mockResolvedValue(new Response('{}'));

    await fetchApi('/api/example', { signal: controller.signal });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/example',
      expect.objectContaining({ signal: controller.signal })
    );
  });
});
