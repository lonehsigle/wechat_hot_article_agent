import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockDbQueue: any[] = [];
let mockDbDefault: any = [];

const mockDb = new Proxy({} as any, {
  get(_, prop) {
    if (prop === 'then') {
      return (resolve: any, reject: any) => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value instanceof Error) {
          reject(value);
        } else {
          Promise.resolve(value).then(resolve, reject);
        }
      };
    }
    return () => mockDb;
  },
});

vi.mock('@/lib/db', () => ({
  db: () => mockDb,
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/wechat-collect/process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  it('returns 501 when background auto processing is not implemented', async () => {
    const { POST } = await import('@/app/api/wechat-collect/process/route');
    mockDbQueue.push(
      [{ id: 1, subscriptionId: 2 }],
      [{ id: 2 }],
      [],
      []
    );

    const res = await POST(createRequest('http://localhost/api/wechat-collect/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: 1 }),
    }));
    const data = await res.json();

    expect(res.status).toBe(501);
    expect(data.success).toBe(false);
    expect(data.error).toContain('后台自动处理功能暂未实现');
  });
});
