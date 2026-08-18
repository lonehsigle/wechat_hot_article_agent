import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadImageFromUrl } from '@/lib/wechat/service';

vi.mock('node:dns/promises', () => {
  const lookupMock = vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]);
  return { default: { lookup: lookupMock }, lookup: lookupMock };
});

describe('wechat service remote image security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects private network image URLs before making a request', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(uploadImageFromUrl(1, 'http://127.0.0.1/image.jpg')).rejects.toThrow(
      '不允许访问本地或私有网络地址'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('adds a timeout signal to remote image requests', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockRejectedValue(new Error('network failed'));

    await expect(uploadImageFromUrl(1, 'https://example.com/image.jpg')).rejects.toThrow('network failed');
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://example.com/image.jpg'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('rejects remote images larger than 10 MB before reading the body', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue(new Response('x', {
      headers: {
        'content-type': 'image/jpeg',
        'content-length': String(10 * 1024 * 1024 + 1),
      },
    }));

    await expect(uploadImageFromUrl(1, 'https://example.com/image.jpg')).rejects.toThrow(
      '响应内容超过 10485760 字节限制'
    );
  });
});
