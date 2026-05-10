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
        if (value instanceof Error) {
          reject(value);
        } else {
          Promise.resolve(value).then(resolve, reject);
        }
      };
    }
    if (prop === 'returning') {
      return () => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value instanceof Error) return Promise.reject(value);
        return Promise.resolve(value);
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
    items: [
      {
        mediaId: 'draft-media-1',
        updateTime: new Date('2026-05-10T00:00:00Z'),
        content: {
          newsItem: [
            {
              title: '真实草稿',
              author: '作者',
              digest: '摘要',
              content: '<p>正文</p>',
              contentSourceUrl: 'https://example.com/source',
              thumbMediaId: 'thumb-1',
              url: 'https://example.com/draft',
              needOpenComment: true,
              onlyFansCanComment: false,
            },
          ],
        },
      },
    ],
  }),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/wechat-drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    mockInsertValues = [];
    mockUpdateValues = [];
  });

  it('syncs drafts through the real WeChat draft batchget service', async () => {
    const { POST } = await import('@/app/api/wechat-drafts/route');
    mockDbQueue.push([]); // no existing draft

    const res = await POST(createRequest('http://localhost/api/wechat-drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync', accountId: 1 }),
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
    expect(data.source).toBe('wechat_draft_batchget');
    expect(mockInsertValues[0]).toMatchObject({
      mediaId: 'draft-media-1',
      title: '真实草稿',
      status: 'draft',
      sourceUrl: 'https://example.com/source',
    });
  });

  it('requires a configured account when no accountId is provided', async () => {
    const { POST } = await import('@/app/api/wechat-drafts/route');
    mockDbQueue.push([]); // default account
    mockDbQueue.push([]); // first account

    const res = await POST(createRequest('http://localhost/api/wechat-drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync' }),
    }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('请先配置公众号账号');
  });

  it('reports deletedCount when clearing all drafts', async () => {
    const { POST } = await import('@/app/api/wechat-drafts/route');
    mockDbQueue.push([{ id: 1 }, { id: 2 }], []);

    const res = await POST(createRequest('http://localhost/api/wechat-drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear-all' }),
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deletedCount).toBe(2);
    expect(data.message).toContain('已清空 2 篇草稿');
  });
});
