import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { scryptSync } from 'crypto';

// Queue-based Proxy mock for drizzle query builder
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
  initDatabase: vi.fn(),
}));

function createRequest(url: string, init?: RequestInit & { cookies?: Record<string, string> }): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  Object.defineProperty(req, 'cookies', {
    value: {
      get: (name: string) => init?.cookies?.[name] ? { name, value: init.cookies[name] } : undefined,
      set: vi.fn(),
      delete: vi.fn(),
    },
    configurable: true,
    writable: true,
  });
  return req as NextRequest;
}

function hashPassword(password: string): string {
  const salt = 'content-monitor-dev-salt';
  return scryptSync(password, salt, 32, {
    N: 16384,
    r: 8,
    p: 1,
  }).toString('hex');
}

describe('/api/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  describe('POST', () => {
    it('should register a new user successfully', async () => {
      const { POST } = await import('@/app/api/auth/route');
      mockDbQueue.push([]); // existing user check by username
      mockDbQueue.push([]); // existing user check by email
      mockDbQueue.push([{ id: 1, username: 'testuser', email: 'test@example.com', displayName: 'Test User', avatar: null, role: 'user' }]); // insert user
      mockDbQueue.push([]); // insert session

      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', username: 'testuser', email: 'test@example.com', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.username).toBe('testuser');
    });

    it('should return 400 when username already exists', async () => {
      const { POST } = await import('@/app/api/auth/route');
      mockDbQueue.push([{ id: 1, username: 'testuser' }]);

      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', username: 'testuser', email: 'test@example.com', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('用户名已存在');
    });

    it('should return 400 when email already registered', async () => {
      const { POST } = await import('@/app/api/auth/route');
      mockDbQueue.push([]); // username check empty
      mockDbQueue.push([{ id: 1, email: 'test@example.com' }]); // email check found

      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', username: 'newuser', email: 'test@example.com', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('邮箱已被注册');
    });

    it('should return 400 when register params are missing', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', username: '', email: '', password: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('不能为空');
    });

    it('should return 400 when password is too short', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', username: 'u', email: 'e@e.com', password: '123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('至少8位');
    });

    it('should login successfully', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const passwordHash = hashPassword('password123');
      mockDbQueue.push([{
        id: 1, username: 'testuser', email: 'test@example.com', displayName: 'Test',
        avatar: null, role: 'user', isActive: true, passwordHash,
      }]);
      mockDbQueue.push([]); // insert session
      mockDbQueue.push([]); // update lastLoginAt

      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', username: 'testuser', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.username).toBe('testuser');
    });

    it('should return 400 when login params are missing', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', username: '', password: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('不能为空');
    });

    it('should return 401 when user not found', async () => {
      const { POST } = await import('@/app/api/auth/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', username: 'unknown', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('用户名或密码错误');
    });

    it('should return 401 for wrong password', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const passwordHash = '3a6c8c7d8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b';
      mockDbQueue.push([{
        id: 1, username: 'testuser', email: 'test@example.com', displayName: 'Test',
        avatar: null, role: 'user', isActive: true, passwordHash,
      }]);

      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', username: 'testuser', password: 'wrongpassword' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 403 when account is disabled', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const passwordHash = hashPassword('password123');
      mockDbQueue.push([{
        id: 1, username: 'testuser', email: 'test@example.com', displayName: 'Test',
        avatar: null, role: 'user', isActive: false, passwordHash,
      }]);

      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', username: 'testuser', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('账号已被禁用');
    });

    it('should logout successfully', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'logout' }),
        headers: { 'Content-Type': 'application/json' },
        cookies: { auth_token: 'token123' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should logout without token', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'logout' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for unknown action', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('未知操作');
    });

    it('should handle POST errors', async () => {
      const { POST } = await import('@/app/api/auth/route');
      const req = createRequest('http://localhost/api/auth', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('服务器错误');
    });
  });

  describe('GET', () => {
    it('should return authenticated false when no token', async () => {
      const { GET } = await import('@/app/api/auth/route');
      const req = createRequest('http://localhost/api/auth');

      const res = await GET(req);
      const data = await res.json();

      expect(data.authenticated).toBe(false);
      expect(data.success).toBe(false);
    });

    it('should return authenticated true with valid token', async () => {
      const { GET } = await import('@/app/api/auth/route');
      mockDbQueue.push([{ userId: 1, token: 'validtoken', expiresAt: new Date(Date.now() + 10000) }]);
      mockDbQueue.push([{ id: 1, username: 'testuser', email: 'test@example.com', displayName: 'Test', avatar: null, role: 'user', isActive: true }]);

      const req = createRequest('http://localhost/api/auth', {
        cookies: { auth_token: 'validtoken' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data.authenticated).toBe(true);
      expect(data.success).toBe(true);
      expect(data.user.username).toBe('testuser');
    });

    it('should return authenticated false when session expired', async () => {
      const { GET } = await import('@/app/api/auth/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/auth', {
        cookies: { auth_token: 'expiredtoken' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data.authenticated).toBe(false);
    });

    it('should return authenticated false when user not found', async () => {
      const { GET } = await import('@/app/api/auth/route');
      mockDbQueue.push([{ userId: 1, token: 'validtoken', expiresAt: new Date(Date.now() + 10000) }]);
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/auth', {
        cookies: { auth_token: 'validtoken' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data.authenticated).toBe(false);
      expect(data.success).toBe(false);
    });

    it('should return authenticated false when user is inactive', async () => {
      const { GET } = await import('@/app/api/auth/route');
      mockDbQueue.push([{ userId: 1, token: 'validtoken', expiresAt: new Date(Date.now() + 10000) }]);
      mockDbQueue.push([{ id: 1, username: 'testuser', isActive: false }]);

      const req = createRequest('http://localhost/api/auth', {
        cookies: { auth_token: 'validtoken' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data.authenticated).toBe(false);
      expect(data.success).toBe(false);
    });

    it('should handle GET errors', async () => {
      const { GET } = await import('@/app/api/auth/route');
      mockDbQueue.push(new Error('DB error'));

      const req = createRequest('http://localhost/api/auth', {
        cookies: { auth_token: 'token' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data.authenticated).toBe(false);
      expect(data.success).toBe(false);
    });
  });
});
