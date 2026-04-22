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
        } else if (value && typeof value.then === 'function') {
          value.then(resolve, reject);
        } else {
          resolve(value);
        }
      };
    }
    if (prop === 'returning') {
      return () => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value instanceof Error) {
          return Promise.reject(value);
        }
        return Promise.resolve(value);
      };
    }
    return (...args: any[]) => mockDb;
  },
});

vi.mock('@/lib/db', () => ({
  db: () => mockDb,
}));

vi.mock('@/lib/llm/service', () => ({
  callLLM: vi.fn(() => Promise.resolve({ content: '{"titleStrategy":"test","openingStyle":"test","articleFramework":"test","contentProgression":"test","endingDesign":"test","languageStyle":"test","emotionalHooks":[],"articleType":"test","template":"test","exampleTitles":[]}', usage: { total_tokens: 100 } })),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/styles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  describe('GET', () => {
    it('should list writing styles', async () => {
      const { GET } = await import('@/app/api/styles/route');
      mockDbQueue.push([
        { id: 1, name: 'Style 1', template: 'Template 1' },
      ]);

      const req = createRequest('http://localhost/api/styles?type=writing');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });

    it('should list layout styles', async () => {
      const { GET } = await import('@/app/api/styles/route');
      mockDbQueue.push([
        { id: 1, name: 'Layout 1', description: 'Desc' },
      ]);

      const req = createRequest('http://localhost/api/styles?type=layout');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle database errors', async () => {
      const { GET } = await import('@/app/api/styles/route');
      mockDbQueue.push(Promise.reject(new Error('DB error')));

      const req = createRequest('http://localhost/api/styles');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST', () => {
    it('should analyze articles successfully', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({
          action: 'analyze',
          articles: [{ title: 'Article 1', content: 'Content 1' }],
          styleName: 'Test Style',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis).toBeDefined();
    });

    it('should return 400 when analyze missing articles', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'analyze', articles: [] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('至少一篇文章');
    });

    it('should save style successfully', async () => {
      const { POST } = await import('@/app/api/styles/route');
      mockDbQueue.push([{ id: 1, name: 'Saved Style' }]);

      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save',
          name: 'Saved Style',
          analysis: { titleStrategy: 'test', openingStyle: 'test', articleFramework: 'test', contentProgression: 'test', endingDesign: 'test', languageStyle: 'test', emotionalHooks: [], articleType: 'test', template: 'test', exampleTitles: [] },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.style.id).toBe(1);
    });

    it('should return 400 when save missing params', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'save', name: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少风格名称');
    });

    it('should handle save DB errors', async () => {
      const { POST } = await import('@/app/api/styles/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save',
          name: 'Saved Style',
          analysis: { titleStrategy: 'test', openingStyle: 'test', articleFramework: 'test', contentProgression: 'test', endingDesign: 'test', languageStyle: 'test', emotionalHooks: [], articleType: 'test', template: 'test', exampleTitles: [] },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('保存风格失败');
    });

    it('should delete style successfully', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', styleId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when delete missing styleId', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少风格ID');
    });

    it('should handle delete DB errors', async () => {
      const { POST } = await import('@/app/api/styles/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', styleId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('删除风格失败');
    });

    it('should save layout style successfully', async () => {
      const { POST } = await import('@/app/api/styles/route');
      mockDbQueue.push([{ id: 1, name: 'Layout Style' }]);

      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save-layout',
          name: 'Layout Style',
          description: 'Desc',
          config: { headerStyle: 'bold' },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when save-layout missing name', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'save-layout' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少排版风格名称');
    });

    it('should handle save-layout DB errors', async () => {
      const { POST } = await import('@/app/api/styles/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save-layout',
          name: 'Layout Style',
          description: 'Desc',
          config: { headerStyle: 'bold' },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('保存排版风格失败');
    });

    it('should delete layout style successfully', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-layout', styleId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when delete-layout missing styleId', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-layout' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少排版风格ID');
    });

    it('should handle delete-layout DB errors', async () => {
      const { POST } = await import('@/app/api/styles/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-layout', styleId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('删除排版风格失败');
    });

    it('should handle invalid JSON from LLM analysis', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const { callLLM } = await import('@/lib/llm/service');
      vi.mocked(callLLM).mockResolvedValueOnce({ content: 'not-json', usage: { totalTokens: 10 } as any });

      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({
          action: 'analyze',
          articles: [{ title: 'Article 1', content: 'Content 1' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis.titleStrategy).toContain('解析失败');
    });

    it('should handle LLM errors in analysis', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const { callLLM } = await import('@/lib/llm/service');
      vi.mocked(callLLM).mockRejectedValueOnce(new Error('LLM fail'));

      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({
          action: 'analyze',
          articles: [{ title: 'Article 1', content: 'Content 1' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should return 400 for invalid JSON body', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should return 400 for unknown action', async () => {
      const { POST } = await import('@/app/api/styles/route');
      const req = createRequest('http://localhost/api/styles', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('未知操作');
    });
  });
});
