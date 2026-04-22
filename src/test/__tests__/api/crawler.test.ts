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

describe('/api/crawler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  describe('GET', () => {
    it('should list posts successfully without platform', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, platform: 'weibo', title: 'Post 1' }]);

      const req = createRequest('http://localhost/api/crawler?action=list-posts');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.posts).toHaveLength(1);
    });

    it('should list posts with platform filter', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 2, platform: 'weibo', title: 'Filtered' }]);

      const req = createRequest('http://localhost/api/crawler?action=list-posts&platform=weibo');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.posts[0].title).toBe('Filtered');
    });

    it('should return 400 for invalid limit (negative)', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler?action=list-posts&limit=-1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid limit');
    });

    it('should return 400 for invalid limit (NaN)', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler?action=list-posts&limit=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid limit');
    });

    it('should get post successfully', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, title: 'Test Post' }]);

      const req = createRequest('http://localhost/api/crawler?action=get-post&id=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.post.title).toBe('Test Post');
    });

    it('should return 400 when get-post missing id', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler?action=get-post');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('id is required');
    });

    it('should return 400 when get-post id is invalid', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler?action=get-post&id=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid id');
    });

    it('should return 404 when post not found', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/crawler?action=get-post&id=999');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('Post not found');
    });

    it('should handle db error in get-post', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler?action=get-post&id=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should list comments successfully', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, content: 'Nice', likeCount: 5 }]);

      const req = createRequest('http://localhost/api/crawler?action=list-comments&postId=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.comments).toHaveLength(1);
    });

    it('should return 400 when list-comments missing postId', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler?action=list-comments');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('postId is required');
    });

    it('should return 400 when list-comments postId is invalid', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler?action=list-comments&postId=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid postId');
    });

    it('should handle db error in list-comments', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler?action=list-comments&postId=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should list creators without platform', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, name: 'Creator1', followerCount: 100 }]);

      const req = createRequest('http://localhost/api/crawler?action=list-creators');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.creators).toHaveLength(1);
    });

    it('should list creators with platform filter', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 2, name: 'Creator2', platform: 'weibo' }]);

      const req = createRequest('http://localhost/api/crawler?action=list-creators&platform=weibo');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.creators[0].platform).toBe('weibo');
    });

    it('should handle db error in list-creators', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler?action=list-creators');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should list tasks successfully', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, status: 'completed' }]);

      const req = createRequest('http://localhost/api/crawler?action=list-tasks');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tasks).toHaveLength(1);
    });

    it('should handle db error in list-tasks', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler?action=list-tasks');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should get word-cloud successfully', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, postId: 1, topKeywords: '[]' }]);

      const req = createRequest('http://localhost/api/crawler?action=word-cloud&postId=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.wordCloud.id).toBe(1);
    });

    it('should return 400 when word-cloud missing postId', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler?action=word-cloud');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('postId is required');
    });

    it('should return 400 when word-cloud postId is invalid', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler?action=word-cloud&postId=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid postId');
    });

    it('should handle db error in word-cloud', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler?action=word-cloud&postId=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should return 400 for unknown action', async () => {
      const { GET } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler?action=unknown');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });
  });

  describe('POST', () => {
    it('should search posts successfully without cookie', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, platform: 'weibo', status: 'running' }]);
      mockDbDefault = [{ id: 999 }];

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'search', platform: 'weibo', keyword: 'test', limit: 2 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isRealData).toBe(false);
    });

    it('should return 400 when search missing params', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'search', platform: '', keyword: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('platform and keyword are required');
    });

    it('should search with cookie for unsupported platform and mark failed', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, platform: 'xiaohongshu', status: 'running' }]);
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'search', platform: 'xiaohongshu', keyword: 'test', cookie: 'some_cookie' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toContain('真实爬取被目标平台阻止');
    });

    it('should search with cookie for weibo and real fetch succeeds', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            cards: [
              {
                mblog: {
                  id: '123',
                  text: 'Test weibo post',
                  user: { id: 'u1', screen_name: 'User1', profile_image_url: 'avatar.jpg' },
                  pics: [],
                  attitudes_count: 10,
                  comments_count: 5,
                  reposts_count: 2,
                  readt_count: 100,
                },
              },
            ],
          },
        }),
      });
      try {
        mockDbQueue.push([{ id: 1, status: 'running' }]);
        mockDbQueue.push([{ id: 101 }]);
        mockDbQueue.push([]);

        const req = createRequest('http://localhost/api/crawler', {
          method: 'POST',
          body: JSON.stringify({ action: 'search', platform: 'weibo', keyword: 'test', cookie: 'cookie=val', limit: 1 }),
          headers: { 'Content-Type': 'application/json' },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.isRealData).toBe(true);
        expect(data.posts).toHaveLength(1);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should search with cookie for weibo but fetch fails', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      try {
        mockDbQueue.push([{ id: 1, status: 'running' }]);
        mockDbQueue.push([]);

        const req = createRequest('http://localhost/api/crawler', {
          method: 'POST',
          body: JSON.stringify({ action: 'search', platform: 'weibo', keyword: 'test', cookie: 'cookie=val' }),
          headers: { 'Content-Type': 'application/json' },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.error).toContain('真实爬取被目标平台阻止');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should crawl post successfully', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, platform: 'weibo', status: 'running' }]);
      mockDbQueue.push([{ id: 1 }]);
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-post', platform: 'weibo', postId: '123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when crawl-post missing params', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-post', platform: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('platform and postId are required');
    });

    it('should handle db error in crawl-post', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-post', platform: 'weibo', postId: '123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should crawl comments successfully', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, platform: 'weibo' }]);
      mockDbDefault = [{ id: 999 }];

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-comments', postId: 1, includeReplies: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.total).toBeGreaterThan(0);
    });

    it('should return 400 when crawl-comments missing postId', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-comments' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('postId is required');
    });

    it('should return 404 when crawl-comments post not found', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-comments', postId: 999 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('Post not found');
    });

    it('should handle db error in crawl-comments', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-comments', postId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should add creator successfully', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, platform: 'weibo', creatorId: 'c1', name: 'Creator' }]);

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'add-creator', platform: 'weibo', creatorId: 'c1', name: 'Creator' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.creator.name).toBe('Creator');
    });

    it('should return 400 when add-creator missing params', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'add-creator', platform: '', creatorId: '', name: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('platform, creatorId and name are required');
    });

    it('should handle db error in add-creator', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'add-creator', platform: 'weibo', creatorId: 'c1', name: 'Creator' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should crawl creator successfully', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1, platform: 'weibo', creatorId: 'c1', name: 'Creator' }]);
      mockDbDefault = [{ id: 999 }];

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-creator', creatorId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.total).toBeGreaterThan(0);
    });

    it('should return 400 when crawl-creator missing creatorId', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-creator' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('creatorId is required');
    });

    it('should return 404 when crawl-creator creator not found', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-creator', creatorId: 999 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('Creator not found');
    });

    it('should handle db error in crawl-creator', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'crawl-creator', creatorId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should generate word-cloud successfully', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([
        { id: 1, platform: 'weibo', sentiment: 'positive', keywords: ['词1', '词2'], content: '太棒了！😊' },
        { id: 2, platform: 'weibo', sentiment: 'negative', keywords: ['词3'], content: '不好😢' },
      ]);
      mockDbQueue.push([{ id: 1, postId: 1 }]);

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate-word-cloud', postId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.wordCloud.postId).toBe(1);
    });

    it('should return 400 when generate-word-cloud missing postId', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate-word-cloud' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('postId is required');
    });

    it('should return 404 when generate-word-cloud no comments found', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate-word-cloud', postId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('No comments found');
    });

    it('should handle db error in generate-word-cloud', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate-word-cloud', postId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should batch crawl with keywords', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1 }]);
      mockDbDefault = [{ id: 999 }];

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'batch-crawl', platform: 'weibo', keywords: ['test'] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.searchedPosts).toBeGreaterThanOrEqual(0);
    });

    it('should batch crawl with postIds', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push([{ id: 1 }]);
      mockDbQueue.push([{ id: 101 }]);
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'batch-crawl', platform: 'weibo', postIds: ['p1'] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.crawledPosts).toBe(1);
    });

    it('should handle error in batch-crawl search', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('Search failed'));

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'batch-crawl', platform: 'weibo', keywords: ['test'] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.errors.length).toBeGreaterThan(0);
    });

    it('should handle error in batch-crawl post', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push(new Error('Crawl failed'));

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'batch-crawl', platform: 'weibo', postIds: ['p1'] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 for unknown action', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should handle server errors', async () => {
      const { POST } = await import('@/app/api/crawler/route');
      mockDbQueue.push(Promise.reject(new Error('Server error')));

      const req = createRequest('http://localhost/api/crawler', {
        method: 'POST',
        body: JSON.stringify({ action: 'search', platform: 'weibo', keyword: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('Server error');
    });
  });
});
