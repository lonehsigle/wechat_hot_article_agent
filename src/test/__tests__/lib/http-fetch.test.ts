import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout, readJsonResponse, readResponseBytes } from '@/lib/http/fetch';

describe('server HTTP utilities', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('adds an abort signal to outbound requests', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockRejectedValue(new Error('network failed'));

    await expect(fetchWithTimeout('https://example.com')).rejects.toThrow('network failed');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('rejects a response whose declared size exceeds the limit', async () => {
    const response = new Response('small', { headers: { 'content-length': '100' } });

    await expect(readResponseBytes(response, 10)).rejects.toThrow('响应内容超过 10 字节限制');
  });

  it('rejects a streamed response that exceeds the limit', async () => {
    const response = new Response('12345678901');

    await expect(readResponseBytes(response, 10)).rejects.toThrow('响应内容超过 10 字节限制');
  });

  it('rejects non-success upstream responses without exposing the body', async () => {
    const response = new Response('{"error":"sensitive upstream detail"}', { status: 502 });

    await expect(readJsonResponse(response)).rejects.toThrow('上游服务请求失败: 502');
  });

  it('rejects oversized JSON responses', async () => {
    const response = new Response('{"value":"too large"}');

    await expect(readJsonResponse(response, 10)).rejects.toThrow('响应内容超过 10 字节限制');
  });
});
