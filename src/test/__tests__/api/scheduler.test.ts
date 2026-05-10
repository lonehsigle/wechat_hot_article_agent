import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/wechat/service', () => ({
  listWechatDrafts: vi.fn().mockResolvedValue({
    totalCount: 1,
    itemCount: 1,
    items: [],
  }),
  syncAllArticleStats: vi.fn().mockResolvedValue({
    success: true,
    synced: 1,
    failed: 0,
    skipped: 0,
    details: [],
  }),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/scheduler', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const scheduler = await import('@/lib/scheduler/service');
    scheduler.shutdownAllTasks();
  });

  it('lists default task statuses', async () => {
    const { GET } = await import('@/app/api/scheduler/route');
    const res = await GET(createRequest('http://localhost/api/scheduler'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.map((task: { name: string }) => task.name)).toEqual(
      expect.arrayContaining(['syncArticleStats', 'syncWechatDrafts', 'hotTopicsCache'])
    );
  });

  it('runs implemented draft sync successfully', async () => {
    const { POST } = await import('@/app/api/scheduler/route');
    const res = await POST(createRequest('http://localhost/api/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run', taskName: 'syncWechatDrafts' }),
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status.runCount).toBe(1);
  });

  it('runs implemented article stat sync successfully', async () => {
    const { POST } = await import('@/app/api/scheduler/route');
    const res = await POST(createRequest('http://localhost/api/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run', taskName: 'syncArticleStats' }),
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status.runCount).toBe(1);
    expect(data.data.status.lastError).toBeNull();
  });

  it('rejects resident start because API routes are not reliable schedulers', async () => {
    const { POST } = await import('@/app/api/scheduler/route');
    const res = await POST(createRequest('http://localhost/api/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', taskName: 'syncArticleStats' }),
    }));
    const data = await res.json();

    expect(res.status).toBe(501);
    expect(data.success).toBe(false);
    expect(data.error).toContain('不提供可靠的常驻定时调度');
  });
});
