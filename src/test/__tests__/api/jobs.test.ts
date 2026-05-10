import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockDbQueue: any[] = [];
let mockDbDefault: any = [];
let mockInsertValues: any[] = [];
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
    if (prop === 'values') {
      return (values: any) => {
        mockInsertValues.push(values);
        return mockDb;
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

vi.mock('@/lib/wechat/service', () => ({
  listWechatDrafts: vi.fn().mockResolvedValue({
    totalCount: 1,
    itemCount: 1,
    items: [],
  }),
  syncAllArticleStats: vi.fn().mockResolvedValue({
    success: true,
    synced: 2,
    failed: 0,
    skipped: 1,
    details: [],
  }),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    mockInsertValues = [];
    mockUpdateValues = [];
  });

  it('lists explicit job contracts', async () => {
    const { GET } = await import('@/app/api/jobs/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'syncArticleStats', status: 'ready' }),
        expect.objectContaining({ name: 'syncWechatDrafts', status: 'ready' }),
        expect.objectContaining({ name: 'processAnalysisQueue', status: 'blocked' }),
      ])
    );
  });

  it('runs implemented jobs and writes audit events', async () => {
    const { POST } = await import('@/app/api/jobs/route');
    const res = await POST(createRequest('http://localhost/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run', jobName: 'syncArticleStats' }),
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({ synced: 2, failed: 0, skipped: 1 });
    expect(mockInsertValues.filter(value => value.type).map(value => value.type)).toEqual(['job_started', 'job_completed']);
    expect(mockInsertValues.some(value => value.jobName === 'syncArticleStats' && value.status === 'running')).toBe(true);
    expect([...mockUpdateValues, ...mockInsertValues].some(value => value.status === 'succeeded' && value.finishedAt)).toBe(true);
  });

  it('returns 501 for blocked jobs', async () => {
    const { POST } = await import('@/app/api/jobs/route');
    const res = await POST(createRequest('http://localhost/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run', jobName: 'processAnalysisQueue' }),
    }));
    const data = await res.json();

    expect(res.status).toBe(501);
    expect(data.success).toBe(false);
    expect(data.status).toBe('blocked');
    expect(data.message).toContain('需要可靠 worker/队列');
    expect([...mockUpdateValues, ...mockInsertValues].some(value => value.status === 'blocked')).toBe(true);
  });
});
