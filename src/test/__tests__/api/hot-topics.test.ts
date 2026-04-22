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
    if (prop === 'returning') {
      return () => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value instanceof Error) return Promise.reject(value);
        return Promise.resolve(value);
      };
    }
    return (...args: any[]) => mockDb;
  },
});

vi.mock('@/lib/db', () => ({
  db: () => mockDb,
  initDatabase: vi.fn(),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/hot-topics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('GET', () => {
    it('should list hot topics with caching', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      mockDbQueue.push([
        { id: 1, title: 'Hot Topic 1', hotValue: 1000, platform: 'weibo' },
      ]);

      const req1 = createRequest('http://localhost/api/hot-topics?action=list');
      const res1 = await GET(req1);
      const data1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data1.data).toHaveLength(1);

      // Second request should hit cache
      mockDbQueue = [];
      const req2 = createRequest('http://localhost/api/hot-topics?action=list');
      const res2 = await GET(req2);
      const data2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(data2.data).toHaveLength(1);
      expect(data2.data[0].title).toBe('Hot Topic 1');
    });

    it('should return 400 for invalid limit', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics?action=list&limit=-1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid limit');
    });

    it('should get black horses with caching', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      mockDbQueue.push([
        { id: 1, title: 'Black Horse', isBlackHorse: true },
      ]);

      const req1 = createRequest('http://localhost/api/hot-topics?action=black-horses');
      const res1 = await GET(req1);
      const data1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(data1.success).toBe(true);

      // Second request should hit cache
      mockDbQueue = [];
      const req2 = createRequest('http://localhost/api/hot-topics?action=black-horses');
      const res2 = await GET(req2);
      const data2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(data2.data[0].title).toBe('Black Horse');
    });

    it('should get trending topics with caching', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      mockDbQueue.push([
        { id: 1, title: 'Trending Topic', trendDirection: 'up' },
      ]);

      const req1 = createRequest('http://localhost/api/hot-topics?action=trending');
      const res1 = await GET(req1);
      const data1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(data1.success).toBe(true);

      // Second request should hit cache
      mockDbQueue = [];
      const req2 = createRequest('http://localhost/api/hot-topics?action=trending');
      const res2 = await GET(req2);
      const data2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(data2.data[0].title).toBe('Trending Topic');
    });

    it('should get history by topicId', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      mockDbQueue.push([
        { id: 1, topicId: 1, hotValue: 100 },
      ]);

      const req = createRequest('http://localhost/api/hot-topics?action=history&topicId=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when history missing topicId', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics?action=history');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('topicId is required');
    });

    it('should return 400 for invalid topicId', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics?action=history&topicId=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid topicId');
    });

    it('should search topics', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      mockDbQueue.push([
        { id: 1, title: 'Search Result', hotValue: 500 },
      ]);

      const req = createRequest('http://localhost/api/hot-topics?action=search&keyword=test');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when search missing keyword', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics?action=search');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('keyword is required');
    });

    it('should return 400 for invalid page parameter', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics?action=search&keyword=test&page=-1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid pagination');
    });

    it('should return 400 for invalid pageSize parameter', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics?action=search&keyword=test&pageSize=200');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid pagination');
    });

    it('should return 400 for NaN page parameter', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics?action=search&keyword=test&page=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid pagination');
    });

    it('should return 400 for invalid action', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics?action=unknown');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should handle database errors', async () => {
      const { GET } = await import('@/app/api/hot-topics/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/hot-topics?action=list&limit=10');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });
  });

  describe('POST', () => {
    it('should return 400 for invalid platform', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid platform');
    });

    it('should fetch platform topics with cookie and real data', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            realtime: [
              { note: 'Weibo Hot', word: 'Weibo Hot', num: 100000, icon_desc: '热', category: '娱乐', desc: 'desc' },
            ],
          },
        }),
      } as Response);

      // existing check → empty → insert returning → history insert
      mockDbQueue.push([], [{ id: 1, title: 'Weibo Hot', platform: 'weibo' }], []);

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'weibo', cookies: { weibo: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.topics[0].isRealData).toBe(true);
    });

    it('should skip existing topics when fetching real data', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            realtime: [
              { note: 'Existing', word: 'Existing', num: 100000, icon_desc: '热', category: '娱乐', desc: 'desc' },
            ],
          },
        }),
      } as Response);

      // existing check returns non-empty → continue → inserted stays empty
      mockDbQueue.push([{ id: 99 }]);

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'weibo', cookies: { weibo: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.count).toBe(0);
    });

    it('should handle weibo fetch exception in catch block', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockRejectedValue(new Error('Weibo fetch failed'));
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'weibo', cookies: { weibo: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle non-Error fetch rejection', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockRejectedValue('string error');
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'weibo', cookies: { weibo: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should fetch platform topics without cookie using mock data', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'weibo' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should insert mock topics when no cookie and not existing', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      // First select returns empty, then insert, then history
      // Rest use default (existing found → skip)
      mockDbQueue.push([], [{ id: 1, title: 'Mock Topic', platform: 'weibo' }], []);
      mockDbDefault = [{ id: 99 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'weibo' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.count).toBe(1);
    });

    it('should fetch all platforms with cookies', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockImplementation((url: any) => {
        const urlStr = typeof url === 'string' ? url : url.toString?.() || '';
        if (urlStr.includes('weibo')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              data: {
                realtime: [
                  { note: 'Weibo', word: 'Weibo', num: 100000, icon_desc: '热', category: '娱乐', desc: 'desc' },
                ],
              },
            }),
          } as Response);
        }
        if (urlStr.includes('baidu')) {
          return Promise.resolve({
            ok: true,
            text: async () => '<!--s-data:{"data":{"cards":[{"content":[{"word":"Baidu","desc":"desc","url":"https://baidu.com","hotScore":100000,"category":"热点"}]}]}}]-->',
          } as Response);
        }
        return Promise.resolve({ ok: false, status: 403 } as Response);
      });

      // weibo: existing + insert + history
      mockDbQueue.push([], [{ id: 1, title: 'Weibo', platform: 'weibo' }], []);
      // baidu: existing + insert + history
      mockDbQueue.push([], [{ id: 2, title: 'Baidu', platform: 'baidu' }], []);
      // remaining platforms use mock data with default existing
      mockDbDefault = [{ id: 99 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-all', cookies: { weibo: 'c1', zhihu: 'c2', baidu: 'c3', douyin: 'c4', xiaohongshu: 'c5' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.isRealData).toBe(true);
    });

    it('should fetch all platforms without cookies', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-all' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.isRealData).toBe(false);
    });

    it('should predict black horses', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      mockDbQueue.push([
        { id: 1, hotValue: 100000, predictedGrowth: 60 },
        { id: 2, hotValue: 2000000, predictedGrowth: 30 },
      ]);
      // update isBlackHorse
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'predict-black-horses' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].id).toBe(1);
    });

    it('should rewrite articles', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      mockDbQueue.push([
        { id: 1, title: 'Article 1', content: 'Content 1', digest: 'Digest 1' },
        { id: 2, title: 'Article 2', content: 'Content 2', digest: 'Digest 2' },
      ]);
      mockDbQueue.push([{ id: 99, title: 'Rewritten', content: '# Rewritten' }]);

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-articles', articleIds: [1, 2], style: 'test-style' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(99);
    });

    it('should return 400 when rewrite-articles missing articleIds', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-articles' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('articleIds is required');
    });

    it('should return 500 when rewrite-articles finds no articles', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-articles', articleIds: [999] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('No articles found');
    });

    it('should handle douyin fetch error and fallback to mock', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockRejectedValue(new Error('Network error'));
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'douyin', cookies: { douyin: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should fetch douyin real topics successfully', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { Title: 'Douyin Hot', Label: '抖音', LabelDesc: 'desc', Url: 'https://douyin.com', HotValue: 1000000 },
          ],
        }),
      } as Response);

      mockDbQueue.push([], [{ id: 1, title: 'Douyin Hot', platform: 'douyin' }], []);

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'douyin', cookies: { douyin: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.topics[0].isRealData).toBe(true);
    });

    it('should handle xiaohongshu fetch error and fallback to mock', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockRejectedValue(new Error('Network error'));
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'xiaohongshu', cookies: { xiaohongshu: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should fetch xiaohongshu real topics successfully', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            queries: [
              { query: 'XHS Query', title: 'XHS Title' },
            ],
          },
        }),
      } as Response);

      mockDbQueue.push([], [{ id: 1, title: 'XHS Query', platform: 'xiaohongshu' }], []);

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'xiaohongshu', cookies: { xiaohongshu: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.topics[0].isRealData).toBe(true);
    });

    it('should handle weibo fetch non-ok and fallback to mock', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockResolvedValue({ ok: false, status: 403 } as Response);
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'weibo', cookies: { weibo: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle zhihu fetch non-ok and fallback to mock', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockResolvedValue({ ok: false, status: 403 } as Response);
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'zhihu', cookies: { zhihu: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should fetch zhihu real topics successfully', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { target: { title: 'Zhihu Hot', excerpt: 'excerpt', url: 'https://zhihu.com', id: 123 }, detail_text: '100万热度' },
          ],
        }),
      } as Response);

      mockDbQueue.push([], [{ id: 1, title: 'Zhihu Hot', platform: 'zhihu' }], []);

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'zhihu', cookies: { zhihu: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.topics[0].isRealData).toBe(true);
    });

    it('should handle baidu fetch non-ok and fallback to mock', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockResolvedValue({ ok: false, status: 403 } as Response);
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'baidu', cookies: { baidu: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should fetch baidu real topics successfully', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => '<!--s-data:{"data":{"cards":[{"content":[{"word":"Baidu Hot","desc":"desc","url":"https://baidu.com","hotScore":100000,"category":"热点"}]}]}}-->',
      } as Response);

      mockDbQueue.push([], [{ id: 1, title: 'Baidu Hot', platform: 'baidu' }], []);

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-platform', platform: 'baidu', cookies: { baidu: 'cookie1' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.topics[0].isRealData).toBe(true);
    });

    it('should handle mixed fetch-all with some failures', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const fetchMock = vi.mocked(global.fetch);
      fetchMock.mockImplementation((url: any) => {
        if (typeof url === 'string' && url.includes('weibo')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              data: {
                realtime: [
                  { note: 'Weibo', word: 'Weibo', num: 100000, icon_desc: '热', category: '娱乐', desc: 'desc' },
                ],
              },
            }),
          } as Response);
        }
        return Promise.reject(new Error('fail'));
      });

      mockDbQueue.push([], [{ id: 1, title: 'Weibo', platform: 'weibo' }], []);
      mockDbDefault = [{ id: 1 }];

      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'fetch-all', cookies: { weibo: 'c1', douyin: 'c2' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for unknown action', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should handle POST errors', async () => {
      const { POST } = await import('@/app/api/hot-topics/route');
      const req = createRequest('http://localhost/api/hot-topics', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
    });
  });
});
