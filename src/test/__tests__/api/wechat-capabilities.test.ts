import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockDbQueue: any[] = [];
let mockDbDefault: any = [];

const mockDb = new Proxy({} as any, {
  get(_, prop) {
    if (prop === 'then') {
      return (resolve: any, reject: any) => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value instanceof Error) reject(value);
        else Promise.resolve(value).then(resolve, reject);
      };
    }
    if (prop === 'values') {
      return () => mockDb;
    }
    return () => mockDb;
  },
});

vi.mock('@/lib/db', () => ({
  db: () => mockDb,
}));

function createRequest(url: string): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/system/wechat-capabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    vi.stubGlobal('fetch', vi.fn());
  });

  it('reports missing app credentials without calling external APIs', async () => {
    mockDbQueue.push([
      { id: 1, name: 'No Secret', appId: '', appSecret: '', accessToken: null, tokenExpiresAt: null },
    ]);

    const { GET } = await import('@/app/api/system/wechat-capabilities/route');
    const res = await GET(createRequest('http://localhost/api/system/wechat-capabilities?accountId=1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.account.id).toBe(1);
    expect(data.summary.status).toBe('blocked');
    expect(data.checks.credentials.status).toBe('blocked');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('checks token, draft, publish and datacube capabilities against official APIs', async () => {
    mockDbQueue.push([
      { id: 2, name: 'Configured', appId: 'appid', appSecret: 'secret', accessToken: null, tokenExpiresAt: null },
    ]);
    mockDbQueue.push([
      { id: 2, name: 'Configured', appId: 'appid', appSecret: 'secret', accessToken: null, tokenExpiresAt: null },
    ]);
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'token-1', expires_in: 7200 }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ total_count: 0, item_count: 0, item: [] }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ total_count: 0, item_count: 0, item: [] }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ list: [] }),
      } as Response);

    const { GET } = await import('@/app/api/system/wechat-capabilities/route');
    const res = await GET(createRequest('http://localhost/api/system/wechat-capabilities?accountId=2&live=true'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.summary.status).toBe('ready');
    expect(data.checks.accessToken.status).toBe('ready');
    expect(data.checks.draft.status).toBe('ready');
    expect(data.checks.publish.status).toBe('ready');
    expect(data.checks.datacube.status).toBe('ready');
  });
});
