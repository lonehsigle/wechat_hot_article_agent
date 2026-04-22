import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockDbQueue: any[] = [];
let mockDbDefault: any = [];

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
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

describe('/api/materials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  describe('GET', () => {
    it('should list materials successfully', async () => {
      const { GET } = await import('@/app/api/materials/route');
      mockDbQueue.push([
        { id: 1, type: 'quote', title: 'Quote 1', content: 'Content', isUsed: false },
      ]);

      const req = createRequest('http://localhost/api/materials');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should filter materials by type', async () => {
      const { GET } = await import('@/app/api/materials/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/materials?type=quote');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle database errors', async () => {
      const { GET } = await import('@/app/api/materials/route');
      mockDbQueue.push(Promise.reject(new Error('DB error')));

      const req = createRequest('http://localhost/api/materials');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST', () => {
    it('should create material successfully', async () => {
      const { POST } = await import('@/app/api/materials/route');
      mockDbQueue.push([{ id: 1, type: 'quote', title: 'New Quote' }]);

      const req = createRequest('http://localhost/api/materials', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          data: { type: 'quote', source: 'web', title: 'New Quote', content: 'Quote content' },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
    });

    it('should batch create materials', async () => {
      const { POST } = await import('@/app/api/materials/route');
      mockDbQueue.push([{ id: 1 }, { id: 2 }]);

      const req = createRequest('http://localhost/api/materials', {
        method: 'POST',
        body: JSON.stringify({
          action: 'batch-create',
          data: {
            materials: [
              { type: 'quote', source: 'web', title: 'Q1', content: 'C1' },
              { type: 'quote', source: 'web', title: 'Q2', content: 'C2' },
            ],
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.count).toBe(2);
    });

    it('should mark material as used', async () => {
      const { POST } = await import('@/app/api/materials/route');
      mockDbQueue.push([{ id: 1, isUsed: true }]);

      const req = createRequest('http://localhost/api/materials', {
        method: 'POST',
        body: JSON.stringify({ action: 'mark-used', data: { id: 1 } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for unknown action', async () => {
      const { POST } = await import('@/app/api/materials/route');
      const req = createRequest('http://localhost/api/materials', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Unknown action');
    });
  });

  describe('PUT', () => {
    it('should update material successfully', async () => {
      const { PUT } = await import('@/app/api/materials/route');
      mockDbQueue.push([{ id: 1, title: 'Updated' }]);

      const req = createRequest('http://localhost/api/materials', {
        method: 'PUT',
        body: JSON.stringify({ id: 1, data: { title: 'Updated' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle update errors', async () => {
      const { PUT } = await import('@/app/api/materials/route');
      mockDbQueue.push(Promise.reject(new Error('Update failed')));

      const req = createRequest('http://localhost/api/materials', {
        method: 'PUT',
        body: JSON.stringify({ id: 1, data: { title: 'Updated' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE', () => {
    it('should delete material successfully', async () => {
      const { DELETE } = await import('@/app/api/materials/route');
      const req = createRequest('http://localhost/api/materials?id=1');
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when id is missing', async () => {
      const { DELETE } = await import('@/app/api/materials/route');
      const req = createRequest('http://localhost/api/materials');
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Missing id');
    });

    it('should return 400 when id is invalid', async () => {
      const { DELETE } = await import('@/app/api/materials/route');
      const req = createRequest('http://localhost/api/materials?id=abc');
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid id');
    });
  });
});
