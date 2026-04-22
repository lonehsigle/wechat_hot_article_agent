import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockDbQueue: any[] = [];
let mockDbDefault: any = [];

const mockDb = new Proxy({} as any, {
  get(_, prop) {
    if (prop === 'then') {
      return (resolve: any, reject: any) => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value && typeof value.then === 'function') {
          value.then(resolve, reject);
        } else {
          resolve(value);
        }
      };
    }
    return (...args: any[]) => mockDb;
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

describe('/api/contents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  it('should return paginated content list', async () => {
    const { GET } = await import('@/app/api/contents/route');
    mockDbQueue.push([
      { id: 1, title: 'Test Title', readCount: 100, likeCount: 10, author: 'Author', digest: 'Digest', date: new Date(), url: 'http://test' },
      { id: 2, title: 'Another Title', readCount: 50, likeCount: 5, author: 'Author2', digest: 'Digest2', date: new Date(), url: 'http://test2' },
    ]);
    mockDbQueue.push([{ count: 2 }]);

    const req = createRequest('http://localhost/api/contents');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.contents).toHaveLength(2);
    expect(data.data.contents[0].readCount).toBe(100);
    expect(data.data.total).toBe(2);
  });

  it('should use limit and offset from query params', async () => {
    const { GET } = await import('@/app/api/contents/route');
    mockDbQueue.push([]);
    mockDbQueue.push([{ count: 0 }]);

    const req = createRequest('http://localhost/api/contents?limit=5&offset=10');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.contents).toHaveLength(0);
    expect(data.data.total).toBe(0);
  });

  it('should handle NaN limit/offset with defaults', async () => {
    const { GET } = await import('@/app/api/contents/route');
    mockDbQueue.push([]);
    mockDbQueue.push([{ count: 0 }]);

    const req = createRequest('http://localhost/api/contents?limit=abc&offset=xyz');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.contents).toHaveLength(0);
  });

  it('should handle database errors', async () => {
    const { GET } = await import('@/app/api/contents/route');
    mockDbQueue.push(Promise.reject(new Error('DB error')));

    const req = createRequest('http://localhost/api/contents');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain('DB error');
  });
});
