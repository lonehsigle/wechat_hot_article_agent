import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockDbQueue: any[] = [];
let mockDbDefault: any = [];
let mockUpdateValues: any[] = [];

const mockDb = new Proxy({} as any, {
  get(_, prop) {
    if (prop === 'then') {
      return (resolve: any, reject: any) => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value instanceof Error) reject(value);
        else Promise.resolve(value).then(resolve, reject);
      };
    }
    if (prop === 'returning') {
      return () => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value instanceof Error) return Promise.reject(value);
        return Promise.resolve(value);
      };
    }
    if (prop === 'set') {
      return (values: any) => {
        mockUpdateValues.push(values);
        return mockDb;
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

describe('/api/analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    mockUpdateValues = [];
  });

  it('does not create a pending background task from action=start', async () => {
    const { POST } = await import('@/app/api/analysis/route');
    const res = await POST(createRequest('http://localhost/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', keyword: 'AI' }),
    }));
    const data = await res.json();

    expect(res.status).toBe(501);
    expect(data.success).toBe(false);
    expect(data.error).toContain('需要可靠 worker/队列');
  });

  it('marks process requests failed instead of generating mock analysis', async () => {
    const { POST } = await import('@/app/api/analysis/process/route');
    const res = await POST(createRequest('http://localhost/api/analysis/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: 7, keyword: 'AI' }),
    }));
    const data = await res.json();

    expect(res.status).toBe(501);
    expect(data.success).toBe(false);
    expect(data.error).toContain('不执行模拟分析');
    expect(mockUpdateValues[0]).toMatchObject({
      status: 'failed',
      errorMessage: expect.stringContaining('需要可靠 worker/队列'),
    });
  });
});
