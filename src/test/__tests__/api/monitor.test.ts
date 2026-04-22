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

describe('/api/monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  describe('GET', () => {
    it('should return monitor status', async () => {
      const { GET } = await import('@/app/api/monitor/route');
      mockDbQueue.push([{ fetchedAt: new Date() }]);
      mockDbQueue.push([{ createdAt: new Date() }]);
      mockDbQueue.push([{ id: 1 }]);
      mockDbQueue.push([{ id: 2, isBlackHorse: true }]);

      const req = createRequest('http://localhost/api/monitor?action=status');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBeDefined();
    });

    it('should return monitor logs', async () => {
      const { GET } = await import('@/app/api/monitor/route');
      mockDbQueue.push([
        { id: 1, type: 'info', message: 'Log 1' },
      ]);

      const req = createRequest('http://localhost/api/monitor?action=logs');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.logs).toHaveLength(1);
    });

    it('should return alerts', async () => {
      const { GET } = await import('@/app/api/monitor/route');
      mockDbQueue.push([]);
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/monitor?action=alerts');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle GET errors', async () => {
      const { GET } = await import('@/app/api/monitor/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/monitor?action=status');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should return 400 for invalid action', async () => {
      const { GET } = await import('@/app/api/monitor/route');
      const req = createRequest('http://localhost/api/monitor?action=unknown');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });
  });

  describe('POST', () => {
    it('should start monitor successfully', async () => {
      const { POST } = await import('@/app/api/monitor/route');
      mockDbQueue.push([]); // logMonitorEvent

      const req = createRequest('http://localhost/api/monitor', {
        method: 'POST',
        body: JSON.stringify({ action: 'start', interval: 60 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.interval).toBe(60);
    });

    it('should restart monitor when already running', async () => {
      const { POST } = await import('@/app/api/monitor/route');
      mockDbQueue.push([]); // first start logMonitorEvent
      mockDbQueue.push([]); // second start logMonitorEvent

      const req1 = createRequest('http://localhost/api/monitor', {
        method: 'POST',
        body: JSON.stringify({ action: 'start', interval: 60 }),
        headers: { 'Content-Type': 'application/json' },
      });
      await POST(req1);

      const req2 = createRequest('http://localhost/api/monitor', {
        method: 'POST',
        body: JSON.stringify({ action: 'start', interval: 120 }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req2);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.interval).toBe(120);
    });

    it('should stop monitor successfully', async () => {
      const { POST } = await import('@/app/api/monitor/route');
      const req = createRequest('http://localhost/api/monitor', {
        method: 'POST',
        body: JSON.stringify({ action: 'stop' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should run monitor once', async () => {
      const { POST } = await import('@/app/api/monitor/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/monitor', {
        method: 'POST',
        body: JSON.stringify({ action: 'run-once' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBeDefined();
    });

    it('should check black horses', async () => {
      const { POST } = await import('@/app/api/monitor/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/monitor', {
        method: 'POST',
        body: JSON.stringify({ action: 'check-black-horses' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle POST check-black-horses errors', async () => {
      const { POST } = await import('@/app/api/monitor/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/monitor', {
        method: 'POST',
        body: JSON.stringify({ action: 'check-black-horses' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('DB error');
    });

    it('should handle fetchPlatformTopics failure in run-once', async () => {
      const { POST } = await import('@/app/api/monitor/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/monitor', {
        method: 'POST',
        body: JSON.stringify({ action: 'run-once' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.results.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid JSON body', async () => {
      const { POST } = await import('@/app/api/monitor/route');
      const req = createRequest('http://localhost/api/monitor', {
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
      const { POST } = await import('@/app/api/monitor/route');
      const req = createRequest('http://localhost/api/monitor', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });
  });
});
