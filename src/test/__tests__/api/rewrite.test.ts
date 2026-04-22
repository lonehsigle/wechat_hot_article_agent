import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { callLLM, checkAIContent, removeAIFlavor } from '@/lib/llm/service';

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
}));

vi.mock('@/lib/llm/service', () => ({
  callLLM: vi.fn(() => Promise.resolve({ content: 'Rewritten content', usage: { total_tokens: 100 } })),
  checkAIContent: vi.fn(() => Promise.resolve({ score: 30, isAIGenerated: false })),
  removeAIFlavor: vi.fn((text: string) => Promise.resolve(text)),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/rewrite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  describe('GET', () => {
    it('should list rewrites successfully', async () => {
      const { GET } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([
        { id: 1, title: 'Rewrite 1', content: 'Content' },
      ]);

      const req = createRequest('http://localhost/api/rewrite?action=list');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rewrites).toHaveLength(1);
    });

    it('should get rewrite by id', async () => {
      const { GET } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([{ id: 1, title: 'Rewrite 1' }]);

      const req = createRequest('http://localhost/api/rewrite?action=get&id=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rewrite.id).toBe(1);
    });

    it('should return 400 when get id is missing', async () => {
      const { GET } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite?action=get');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('id is required');
    });

    it('should return 400 for invalid id', async () => {
      const { GET } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite?action=get&id=invalid');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid id');
    });

    it('should return 404 when rewrite not found', async () => {
      const { GET } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/rewrite?action=get&id=999');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('Not found');
    });

    it('should return 400 for invalid action', async () => {
      const { GET } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite?action=unknown');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should handle database errors on list', async () => {
      const { GET } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/rewrite?action=list');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should handle database errors on get', async () => {
      const { GET } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/rewrite?action=get&id=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });
  });

  describe('POST', () => {
    it('should rewrite direct content successfully', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-direct', content: 'Original content', title: 'Title', style: '专业正式' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toContain('Rewritten');
    });

    it('should fallback to rewrite-direct when no action but content provided', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ content: 'Original content', title: 'Title', style: '专业正式' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toContain('Rewritten');
    });

    it('should return 400 when rewrite-direct missing content', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-direct', content: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('content is required');
    });

    it('should return 500 when rewrite-direct LLM fails', async () => {
      vi.mocked(callLLM).mockRejectedValueOnce(new Error('LLM error'));
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-direct', content: 'Test content' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('LLM error');
    });

    it('should rewrite articles successfully', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(
        [{ id: 1, title: 'Article 1', digest: 'Digest', content: 'Content' }],
        [{ id: 1, title: 'Rewritten Article', content: 'Rewritten content', aiScore: 30, humanScore: 70 }]
      );

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite', articleIds: [1], style: '综合类', removeAI: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.article).toBeDefined();
      expect(data.stats.originalCount).toBe(1);
    });

    it('should use fallback content when LLM fails for rewrite', async () => {
      vi.mocked(callLLM).mockRejectedValueOnce(new Error('LLM error'));
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(
        [{ id: 1, title: 'Article 1', digest: 'Digest', content: 'Content' }],
        [{ id: 1, title: 'Article 1', content: 'fallback', aiScore: 50, humanScore: 50 }]
      );

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite', articleIds: [1], style: '综合类', removeAI: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.article).toBeDefined();
    });

    it('should return 400 when rewrite missing articleIds', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite', articleIds: [] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('articleIds is required');
    });

    it('should return 404 when no articles found for rewrite', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite', articleIds: [999] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('No articles found');
    });

    it('should handle database errors during rewrite select', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite', articleIds: [1] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should handle database errors during rewrite insert', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(
        [{ id: 1, title: 'Article 1', digest: 'Digest', content: 'Content' }],
        new Error('DB insert error')
      );

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite', articleIds: [1] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB insert error');
    });

    it('should rewrite from topics successfully', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(
        [{ id: 1, title: 'Topic 1', platform: 'weibo', description: 'Desc', hotValue: 100, category: 'tech' }],
        [{ id: 2, title: 'Rewritten from topic', content: 'Content', aiScore: 30, humanScore: 70 }]
      );

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-from-topics', topicIds: [1], style: '热点评论', removeAI: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.article).toBeDefined();
      expect(data.stats.topicCount).toBe(1);
    });

    it('should return 400 when rewrite-from-topics missing topicIds', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-from-topics', topicIds: [] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('topicIds is required');
    });

    it('should return 404 when no topics found for rewrite-from-topics', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-from-topics', topicIds: [999] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('No topics found');
    });

    it('should handle database errors during rewrite-from-topics', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'rewrite-from-topics', topicIds: [1] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should check AI content successfully', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'check-ai', content: 'Some content' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.score).toBe(30);
    });

    it('should return 400 when check-ai missing content', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'check-ai', content: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('content is required');
    });

    it('should return 500 when check-ai fails', async () => {
      vi.mocked(checkAIContent).mockRejectedValueOnce(new Error('Check failed'));
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'check-ai', content: 'Some content' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('Check failed');
    });

    it('should remove AI flavor successfully', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'remove-ai', content: 'AI flavored content' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.content).toBe('AI flavored content');
    });

    it('should return 400 when remove-ai missing content', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'remove-ai', content: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('content is required');
    });

    it('should return 500 when remove-ai fails', async () => {
      vi.mocked(removeAIFlavor).mockRejectedValueOnce(new Error('Remove failed'));
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'remove-ai', content: 'Some content' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('Remove failed');
    });

    it('should list rewrites successfully', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([
        { id: 1, title: 'Rewrite 1', content: 'Content', createdAt: new Date() },
      ]);

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'list-rewrites' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rewrites).toHaveLength(1);
    });

    it('should handle database errors when listing rewrites', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'list-rewrites' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should get rewrite by id successfully', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([{ id: 1, title: 'Rewrite 1', content: 'Content' }]);

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'get-rewrite', id: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rewrite.id).toBe(1);
    });

    it('should return 400 when get-rewrite missing id', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'get-rewrite' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('id is required');
    });

    it('should return 404 when get-rewrite not found', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'get-rewrite', id: 999 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('Not found');
    });

    it('should handle database errors when getting rewrite', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'get-rewrite', id: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should update rewrite successfully', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([{ id: 1, title: 'Updated', content: 'Updated content' }]);

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'update-rewrite', id: 1, content: 'Updated content', title: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rewrite.title).toBe('Updated');
    });

    it('should return 400 when update-rewrite missing id or content', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'update-rewrite', id: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('id and content are required');
    });

    it('should handle database errors when updating rewrite', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'update-rewrite', id: 1, content: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should delete rewrite successfully', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-rewrite', id: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when delete-rewrite missing id', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-rewrite' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('id is required');
    });

    it('should handle database errors when deleting rewrite', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-rewrite', id: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should return 400 for unknown action', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should handle generic POST errors', async () => {
      const { POST } = await import('@/app/api/rewrite/route');
      const req = createRequest('http://localhost/api/rewrite', {
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
