import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { callLLM, analyzeTopicsWithLLM } from '@/lib/llm/service';

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

const mockGetLLMConfig = vi.fn(() => Promise.resolve(null));
const mockSaveLLMConfig = vi.fn(() => Promise.resolve());

vi.mock('@/lib/db/queries', () => ({
  getLLMConfig: (...args: any[]) => mockGetLLMConfig(...args),
  saveLLMConfig: (...args: any[]) => mockSaveLLMConfig(...args),
}));

vi.mock('@/lib/llm/service', () => ({
  callLLM: vi.fn(() => Promise.resolve({ content: '{"summary":"test","insights":[],"topicSuggestions":[],"contentTrends":[],"audienceInsights":[]}', usage: { totalTokens: 100 } as any })),
  analyzeTopicsWithLLM: vi.fn(() => Promise.resolve({ summary: 'test', insights: [], topicSuggestions: [], contentTrends: [], audienceInsights: [] })),
}));

vi.mock('@/lib/prompts', () => ({
  getPromptTemplate: vi.fn(() => Promise.resolve('')),
  getPromptTemplateSync: vi.fn(() => ''),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/topic-analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    mockGetLLMConfig.mockResolvedValue(null);
  });

  describe('GET', () => {
    it('should return LLM config', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', model: 'gpt-4', apiKey: 'key123' });
      const { GET } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.config.provider).toBe('openai');
      expect(data.config.isConfigured).toBe(true);
    });

    it('should return safe config when not configured', async () => {
      mockGetLLMConfig.mockResolvedValueOnce(null);
      const { GET } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.config.isConfigured).toBe(false);
    });

    it('should handle database errors', async () => {
      mockGetLLMConfig.mockRejectedValueOnce(new Error('DB error'));
      const { GET } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST', () => {
    it('should save config successfully', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'save-config', config: { provider: 'openai' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should get wordcloud cache successfully', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push([{ id: 1, cacheKey: 'test-key', basicWordCloud: '[]', articleCount: 5 }]);

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'get-wordcloud-cache', cacheKey: 'test-key' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cache).toBeDefined();
      expect(data.cache.cacheKey).toBe('test-key');
    });

    it('should return 400 when get-wordcloud-cache missing cacheKey', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'get-wordcloud-cache' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('cacheKey');
    });

    it('should handle database errors when getting wordcloud cache', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'get-wordcloud-cache', cacheKey: 'test-key' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should save basic wordcloud successfully', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push(
        [], // no existing cache
        [{ id: 123 }] // insert returning
      );

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save-basic-wordcloud',
          cacheKey: 'test-key',
          wordCloud: [{ word: 'test', count: 5 }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should update existing wordcloud cache', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push(
        [{ id: 1, cacheKey: 'test-key' }], // existing cache
        [] // update
      );

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save-basic-wordcloud',
          cacheKey: 'test-key',
          wordCloud: [{ word: 'test', count: 5 }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when save-basic-wordcloud missing params', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'save-basic-wordcloud' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少参数');
    });

    it('should handle database errors when saving basic wordcloud', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save-basic-wordcloud',
          cacheKey: 'test-key',
          wordCloud: [{ word: 'test', count: 5 }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should process wordcloud with AI successfully', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push(
        [{ id: 1, cacheKey: 'test-key' }], // existing cache for updateAIWordCloud
        [] // update
      );

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'process-wordcloud-ai',
          wordCloud: [{ word: 'test', count: 5 }],
          cacheKey: 'test-key',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.aiWordCloud).toBeDefined();
      expect(data.aiWordCloud).toHaveLength(1);
    });

    it('should process wordcloud with AI without cacheKey', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      const { POST } = await import('@/app/api/topic-analysis/route');

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'process-wordcloud-ai',
          wordCloud: [{ word: 'test', count: 5 }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.aiWordCloud).toBeDefined();
    });

    it('should return 400 when process-wordcloud-ai missing config', async () => {
      mockGetLLMConfig.mockResolvedValueOnce(null);
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'process-wordcloud-ai', wordCloud: [{ word: 'test', count: 5 }] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('LLM API');
    });

    it('should return 400 when process-wordcloud-ai missing wordCloud', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'process-wordcloud-ai' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('没有词云数据');
    });

    it('should return 400 when process-wordcloud-ai has empty wordCloud', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'process-wordcloud-ai', wordCloud: [] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('没有词云数据');
    });

    it('should handle database errors when processing wordcloud AI', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'process-wordcloud-ai',
          wordCloud: [{ word: 'test', count: 5 }],
          cacheKey: 'test-key',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should clear cache with cacheKey', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear-cache', cacheKey: 'test-key' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('缓存已清除');
    });

    it('should clear all cache without cacheKey', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear-cache' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('缓存已清除');
    });

    it('should handle database errors when clearing cache', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear-cache', cacheKey: 'test-key' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should analyze topics successfully', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'analyze',
          articles: [{ title: 'A', readCount: 10, likeCount: 5 }],
          wordCloud: [{ word: 'test', count: 3 }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary).toBe('test');
    });

    it('should return 400 when analyze missing config', async () => {
      mockGetLLMConfig.mockResolvedValueOnce(null);
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'analyze', articles: [{ title: 'A', readCount: 1, likeCount: 1 }] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('LLM API');
    });

    it('should return 400 when analyze missing articles', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'analyze', articles: [] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('没有可分析');
    });

    it('should handle errors during analyze', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      vi.mocked(analyzeTopicsWithLLM).mockRejectedValueOnce(new Error('LLM error'));
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'analyze',
          articles: [{ title: 'A', readCount: 10, likeCount: 5 }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('LLM error');
    });

    it('should generate analysis report successfully', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate-analysis-report',
          articles: [{ title: 'A', readCount: 10, likeCount: 5 }],
          wordCloud: [{ word: 'test', count: 3 }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
    });

    it('should return 400 when generate-analysis-report missing config', async () => {
      mockGetLLMConfig.mockResolvedValueOnce(null);
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate-analysis-report', articles: [{ title: 'A', readCount: 1, likeCount: 1 }] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('LLM API');
    });

    it('should return 400 when generate-analysis-report missing articles', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate-analysis-report', articles: [] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('没有可分析');
    });

    it('should handle LLM errors during generate-analysis-report', async () => {
      mockGetLLMConfig.mockResolvedValueOnce({ provider: 'openai', apiKey: 'key' });
      vi.mocked(callLLM).mockRejectedValueOnce(new Error('LLM error'));
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate-analysis-report',
          articles: [{ title: 'A', readCount: 10, likeCount: 5 }],
          wordCloud: [{ word: 'test', count: 3 }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.report.corePositioning).toBe('分析生成中...');
    });

    it('should return 400 for unknown action', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('未知操作');
    });

    it('should handle generic POST errors', async () => {
      const { POST } = await import('@/app/api/topic-analysis/route');
      const req = createRequest('http://localhost/api/topic-analysis', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
