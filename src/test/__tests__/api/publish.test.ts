import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockDbQueue: any[] = [];
let mockDbDefault: any = [];
let mockAccountResponse: any = { id: 'acc1', authorName: 'Test Author' };
let mockUploadQueue: any[] = [];
let mockUploadDefault: any = { mediaId: 'img123', url: 'http://img.url' };
let mockExtractUrls: any = [];
let mockGenerateImagesResult: any = [
  { id: '1', url: 'http://img1', base64: 'base64data', prompt: 'prompt1', width: 400, height: 300 },
];

const mockDb = new Proxy({} as any, {
  get(_, prop) {
    if (prop === 'then') {
      return (resolve: any, reject: any) => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value && typeof value.then === 'function') {
          value.then(resolve, reject);
        } else {
          resolve(value);
        }
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

vi.mock('@/lib/wechat/service', () => ({
  createDraft: vi.fn(() => Promise.resolve({ mediaId: 'media123' })),
  uploadImageFromUrl: vi.fn(() => {
    const value = mockUploadQueue.length > 0 ? mockUploadQueue.shift() : mockUploadDefault;
    if (value instanceof Error) return Promise.reject(value);
    return Promise.resolve(value);
  }),
  convertToWechatHtml: vi.fn((content: string) => `<div>${content}</div>`),
  extractImageUrls: vi.fn(() => mockExtractUrls),
  getWechatAccount: vi.fn(() => Promise.resolve(mockAccountResponse)),
}));

vi.mock('@/lib/image/service', () => ({
  generateArticleImages: vi.fn(() => {
    if (mockGenerateImagesResult instanceof Error) return Promise.reject(mockGenerateImagesResult);
    return Promise.resolve(mockGenerateImagesResult);
  }),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    mockAccountResponse = { id: 'acc1', authorName: 'Test Author' };
    mockUploadQueue = [];
    mockUploadDefault = { mediaId: 'img123', url: 'http://img.url' };
    mockExtractUrls = [];
    mockGenerateImagesResult = [
      { id: '1', url: 'http://img1', base64: 'base64data', prompt: 'prompt1', width: 400, height: 300 },
    ];
  });

  describe('GET', () => {
    it('should list published articles', async () => {
      const { GET } = await import('@/app/api/publish/route');
      mockDbQueue.push([
        { id: 1, title: 'Article 1', publishStatus: 'draft' },
      ]);

      const req = createRequest('http://localhost/api/publish');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.articles).toHaveLength(1);
    });

    it('should get article stats', async () => {
      const { GET } = await import('@/app/api/publish/route');
      mockDbQueue.push([
        { id: 1, articleId: 1, readCount: 100 },
      ]);

      const req = createRequest('http://localhost/api/publish?articleId=1&stats=true');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toHaveLength(1);
    });

    it('should return 400 for invalid articleId', async () => {
      const { GET } = await import('@/app/api/publish/route');
      const req = createRequest('http://localhost/api/publish?articleId=abc&stats=true');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid articleId');
    });

    it('should handle database errors', async () => {
      const { GET } = await import('@/app/api/publish/route');
      mockDbQueue.push(Promise.reject(new Error('DB error')));

      const req = createRequest('http://localhost/api/publish');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST', () => {
    it('should search images successfully', async () => {
      const { POST } = await import('@/app/api/publish/route');
      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({ action: 'search-images', title: 'Test', content: 'Content' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.images).toHaveLength(1);
    });

    it('should return 400 when search-images missing params', async () => {
      const { POST } = await import('@/app/api/publish/route');
      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({ action: 'search-images', title: '', content: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('不能为空');
    });

    it('should upload image successfully', async () => {
      const { POST } = await import('@/app/api/publish/route');
      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({ action: 'upload-image', accountId: 'acc1', imageUrl: 'http://example.com/img.jpg' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.mediaId).toBe('img123');
      expect(data.url).toBe('http://img.url');
    });

    it('should return 400 when upload-image missing imageUrl', async () => {
      const { POST } = await import('@/app/api/publish/route');
      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({ action: 'upload-image', accountId: 'acc1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('imageUrl参数不能为空');
    });

    it('should publish-with-images successfully', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockDbQueue.push([{ id: 1, title: 'Test Article', publishStatus: 'draft' }]);

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish-with-images',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Paragraph 1\n\nParagraph 2\n\nParagraph 3',
          images: [
            { imageBase64: 'base64-0' },
            { imageBase64: 'base64-1' },
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.mediaId).toBe('media123');
      expect(data.articleId).toBe(1);
    });

    it('should publish-with-images successfully without images', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockDbQueue.push([{ id: 2, title: 'Test Article', publishStatus: 'draft' }]);

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish-with-images',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Paragraph 1\n\nParagraph 2',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.articleId).toBe(2);
    });

    it('should handle image upload failures in publish-with-images', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockDbQueue.push([{ id: 5, title: 'Test Article', publishStatus: 'draft' }]);
      mockUploadQueue.push(new Error('thumb upload failed'));
      mockUploadQueue.push(new Error('image upload failed'));

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish-with-images',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Paragraph 1\n\nParagraph 2',
          images: [
            { imageBase64: 'base64-0' },
            { imageBase64: 'base64-1' },
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.articleId).toBe(5);
    });

    it('should return 400 when publish-with-images account not found', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockAccountResponse = null;

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish-with-images',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('公众号账号不存在');
    });

    it('should publish successfully with autoSearchImages', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockDbQueue.push([{ id: 3, title: 'Test Article', publishStatus: 'draft' }]);

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content here',
          autoSearchImages: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.mediaId).toBe('media123');
      expect(data.articleId).toBe(3);
    });

    it('should publish and handle content images', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockDbQueue.push([{ id: 4, title: 'Test Article', publishStatus: 'draft' }]);
      mockExtractUrls = ['http://content.img/1.jpg', 'http://content.img/2.jpg'];

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content with images',
          autoSearchImages: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.articleId).toBe(4);
    });

    it('should return 400 when publish account not found', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockAccountResponse = null;

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('公众号账号不存在');
    });

    it('should return 400 when publish missing thumbMediaId', async () => {
      const { POST } = await import('@/app/api/publish/route');

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少封面图片');
    });

    it('should return 400 when autoSearchImages cover upload fails', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockUploadQueue.push(new Error('cover upload failed'));

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content',
          autoSearchImages: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少封面图片');
    });

    it('should handle content image upload failure in publish', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockDbQueue.push([{ id: 6, title: 'Test Article', publishStatus: 'draft' }]);
      mockUploadQueue.push({ mediaId: 'thumb123', url: 'http://thumb.url' });
      mockUploadQueue.push(new Error('content image upload failed'));
      mockExtractUrls = ['http://content.img/1.jpg'];

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content with image',
          autoSearchImages: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.articleId).toBe(6);
    });

    it('should preview html successfully', async () => {
      const { POST } = await import('@/app/api/publish/route');
      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({ action: 'preview-html', content: '# Hello' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.html).toContain('Hello');
    });

    it('should return 400 when preview-html missing content', async () => {
      const { POST } = await import('@/app/api/publish/route');
      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({ action: 'preview-html', content: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('不能为空');
    });

    it('should return 400 for unknown action', async () => {
      const { POST } = await import('@/app/api/publish/route');
      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('未知操作');
    });

    it('should handle database error in publish-with-images', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockDbQueue.push(Promise.reject(new Error('Insert failed')));

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish-with-images',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle database error in publish', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockDbQueue.push(Promise.reject(new Error('Insert failed')));

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content',
          autoSearchImages: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should return 400 when generateArticleImages fails', async () => {
      const { POST } = await import('@/app/api/publish/route');
      mockGenerateImagesResult = new Error('generation failed');

      const req = createRequest('http://localhost/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          action: 'publish',
          accountId: 'acc1',
          title: 'Test Article',
          content: 'Content',
          autoSearchImages: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少封面图片');
    });

    it('should handle unexpected error in POST', async () => {
      const { POST } = await import('@/app/api/publish/route');
      const req = createRequest('http://localhost/api/publish', {
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
