import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { unifiedSearch } from '@/lib/search/service';

let mockDbQueue: any[] = [];
let mockDbDefault: any = [];
let mockInsertValues: any[] = [];

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
    if (prop === 'values') {
      return (values: any) => {
        mockInsertValues.push(values);
        return mockDb;
      };
    }
    return () => mockDb;
  },
});

vi.mock('@/lib/db', () => ({
  db: () => mockDb,
}));

vi.mock('@/lib/search/service', () => ({
  unifiedSearch: vi.fn(),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

function mockLLMMaterialResponse() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                title: '素材标题',
                content: '素材内容',
                keyPoints: ['观点1'],
                quotes: ['金句1'],
                dataPoints: ['数据1'],
                tags: ['标签1'],
              },
            ]),
          },
        },
      ],
    }),
  }));
}

describe('/api/hot-topic-collect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    mockInsertValues = [];
    mockLLMMaterialResponse();
  });

  it('uses real search URLs for related articles', async () => {
    vi.mocked(unifiedSearch).mockResolvedValue({
      keyword: 'AI',
      items: [
        {
          title: '真实文章',
          url: 'https://example.com/article',
          description: '真实摘要',
          source: 'test',
        },
      ],
    });
    mockDbQueue.push([{ id: 1, title: '素材标题' }]);

    const { POST } = await import('@/app/api/hot-topic-collect/route');
    const req = createRequest('http://localhost/api/hot-topic-collect', {
      method: 'POST',
      body: JSON.stringify({
        action: 'collect-single',
        data: {
          topic: { id: 1, title: 'AI', platform: 'weibo', hotValue: 1000 },
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.relatedArticles).toEqual([
      { title: '真实文章', summary: '真实摘要', url: 'https://example.com/article' },
    ]);
    expect(JSON.parse(mockInsertValues[0][0].tags)).toEqual(
      expect.arrayContaining(['AI生成', '待核验', '基于搜索摘要'])
    );
    expect(mockInsertValues[0][0].sourceScore).toBeGreaterThan(0);
    expect(mockInsertValues[0][0].verificationStatus).toBe('needs_review');
    expect(JSON.parse(mockInsertValues[0][0].dataPoints)).toContain('素材由模型生成，事实、数据与案例需人工核验后使用');
  });

  it('does not fabricate related article URLs when search is unavailable', async () => {
    vi.mocked(unifiedSearch).mockResolvedValue({
      keyword: 'AI',
      items: [],
      error: '搜索失败',
    });
    mockDbQueue.push([{ id: 1, title: '素材标题' }]);

    const { POST } = await import('@/app/api/hot-topic-collect/route');
    const req = createRequest('http://localhost/api/hot-topic-collect', {
      method: 'POST',
      body: JSON.stringify({
        action: 'collect-single',
        data: {
          topic: { id: 1, title: 'AI', platform: 'weibo', hotValue: 1000 },
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.relatedArticles).toEqual([]);
    expect(JSON.parse(mockInsertValues[0][0].tags)).toEqual(
      expect.arrayContaining(['AI生成', '待核验', '无外部文章'])
    );
    expect(mockInsertValues[0][0].sourceScore).toBe(0);
  });

  it('reports batch collection as failed when every topic fails', async () => {
    vi.mocked(unifiedSearch).mockResolvedValue({
      keyword: 'AI',
      items: [],
      error: '搜索失败',
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));

    const { POST } = await import('@/app/api/hot-topic-collect/route');
    const req = createRequest('http://localhost/api/hot-topic-collect', {
      method: 'POST',
      body: JSON.stringify({
        action: 'collect-batch',
        data: {
          topics: [
            { id: 1, title: 'AI', platform: 'weibo', hotValue: 1000 },
            { id: 2, title: '出海', platform: 'zhihu', hotValue: 900 },
          ],
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toContain('全部失败');
    expect(data.results).toHaveLength(2);
  });
});
