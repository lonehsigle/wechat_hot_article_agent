import { describe, expect, it, vi } from 'vitest';
import { lookup } from 'node:dns/promises';
import { assertSafeRemoteUrl, assertSafeRemoteUrlResolved } from '@/lib/safe-remote-url';

vi.mock('node:dns/promises', () => {
  const lookupMock = vi.fn();
  return { default: { lookup: lookupMock }, lookup: lookupMock };
});

describe('safe remote URL validation', () => {
  it('allows ordinary public hostnames beginning with fc', () => {
    expect(assertSafeRemoteUrl('https://fcloud.example/image.jpg').hostname).toBe('fcloud.example');
  });

  it('rejects carrier-grade NAT addresses', () => {
    expect(() => assertSafeRemoteUrl('http://100.64.0.1/image.jpg')).toThrow(
      '不允许访问本地或私有网络地址'
    );
  });

  it('rejects IPv4-mapped loopback addresses', () => {
    expect(() => assertSafeRemoteUrl('http://[::ffff:127.0.0.1]/image.jpg')).toThrow(
      '不允许访问本地或私有网络地址'
    );
  });

  it('rejects non-HTTP protocols', () => {
    expect(() => assertSafeRemoteUrl('file://example.com/image.jpg')).toThrow(
      '远程资源仅支持 HTTP 或 HTTPS'
    );
  });

  it('rejects public hostnames that resolve to private addresses', async () => {
    vi.mocked(lookup).mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);

    await expect(assertSafeRemoteUrlResolved('https://example.com/image.jpg')).rejects.toThrow(
      '不允许访问解析到本地或私有网络的地址'
    );
  });
});
