import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { syncAllArticleStats } from '@/lib/wechat/service';

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
    return () => mockDb;
  },
});

vi.mock('@/lib/db', () => ({
  db: () => mockDb,
}));

vi.mock('@/lib/wechat/service', () => ({
  syncAllArticleStats: vi.fn(),
}));

function createRequest(url: string): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  it('reports sync status without implicit background sync', async () => {
    const oldRecordTime = new Date(Date.now() - 60 * 60 * 1000);
    mockDbQueue.push([{ recordTime: oldRecordTime }]); // latest stats
    mockDbQueue.push([]); // articles
    mockDbQueue.push([]); // stats

    const { GET } = await import('@/app/api/analytics/route');
    const res = await GET(createRequest('http://localhost/api/analytics?range=7d&autoSync=true'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.syncStatus).toMatchObject({
      needsSync: true,
      staleAfterMinutes: 30,
      syncEndpoint: '/api/analytics/sync',
      jobName: 'syncArticleStats',
    });
    expect(syncAllArticleStats).not.toHaveBeenCalled();
  });
});
