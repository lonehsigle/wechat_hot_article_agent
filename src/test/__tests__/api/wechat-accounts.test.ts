import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockVerifyAuth = vi.fn(() => Promise.resolve({ authenticated: true, user: { id: 1, username: 'test', role: 'admin' } }));
const mockUnauthorizedResponse = vi.fn(() => new Response(JSON.stringify({ success: false, error: '请先登录', authenticated: false }), { status: 401 }));

vi.mock('@/lib/auth', () => ({
  verifyAuth: (...args: any[]) => mockVerifyAuth(...args),
  unauthorizedResponse: (...args: any[]) => mockUnauthorizedResponse(...args),
}));

vi.mock('@/lib/db', () => ({
  db: vi.fn(),
  initDatabase: vi.fn(),
}));

const mockGetWechatAccounts = vi.fn(() => Promise.resolve([{ id: 1, name: 'Account 1' }]));
const mockGetWechatAccountById = vi.fn(() => Promise.resolve({ id: 1, name: 'Account 1' }));
const mockGetDefaultWechatAccount = vi.fn(() => Promise.resolve({ id: 1, name: 'Default' }));
const mockCreateWechatAccount = vi.fn(() => Promise.resolve({ id: 2, name: 'New Account' }));
const mockUpdateWechatAccount = vi.fn(() => Promise.resolve({ id: 1, name: 'Updated' }));
const mockDeleteWechatAccount = vi.fn(() => Promise.resolve(true));
const mockSetDefaultWechatAccount = vi.fn(() => Promise.resolve());

vi.mock('@/lib/db/queries', () => ({
  getWechatAccounts: (...args: any[]) => mockGetWechatAccounts(...args),
  getWechatAccountById: (...args: any[]) => mockGetWechatAccountById(...args),
  getDefaultWechatAccount: (...args: any[]) => mockGetDefaultWechatAccount(...args),
  createWechatAccount: (...args: any[]) => mockCreateWechatAccount(...args),
  updateWechatAccount: (...args: any[]) => mockUpdateWechatAccount(...args),
  deleteWechatAccount: (...args: any[]) => mockDeleteWechatAccount(...args),
  setDefaultWechatAccount: (...args: any[]) => mockSetDefaultWechatAccount(...args),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  Object.defineProperty(req, 'cookies', {
    value: { get: vi.fn(() => ({ value: 'token' })) },
    configurable: true,
    writable: true,
  });
  return req as NextRequest;
}

describe('/api/wechat-accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAuth.mockResolvedValue({ authenticated: true, user: { id: 1, username: 'test', role: 'admin' } });
  });

  describe('GET', () => {
    it('should list accounts successfully', async () => {
      const { GET } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });

    it('should get account by id', async () => {
      const { GET } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts?id=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
    });

    it('should get default account', async () => {
      const { GET } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts?default=true');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 401 when unauthorized', async () => {
      mockVerifyAuth.mockResolvedValueOnce({ authenticated: false });
      const { GET } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.authenticated).toBe(false);
    });

    it('should handle database errors', async () => {
      mockGetWechatAccounts.mockRejectedValueOnce(new Error('DB error'));
      const { GET } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST', () => {
    it('should create account successfully', async () => {
      const { POST } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Account', appId: 'app123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 401 when unauthorized', async () => {
      mockVerifyAuth.mockResolvedValueOnce({ authenticated: false });
      const { POST } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts', {
        method: 'POST',
        body: JSON.stringify({ name: 'New' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.authenticated).toBe(false);
    });
  });

  describe('PUT', () => {
    it('should update account successfully', async () => {
      const { PUT } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts', {
        method: 'PUT',
        body: JSON.stringify({ id: 1, name: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when id is missing', async () => {
      const { PUT } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('ID is required');
    });

    it('should return 404 when account not found', async () => {
      mockGetWechatAccountById.mockResolvedValueOnce(null);
      const { PUT } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts', {
        method: 'PUT',
        body: JSON.stringify({ id: 999, name: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('不存在');
    });

    it('should return 401 when unauthorized', async () => {
      mockVerifyAuth.mockResolvedValueOnce({ authenticated: false });
      const { PUT } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts', {
        method: 'PUT',
        body: JSON.stringify({ id: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req);
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE', () => {
    it('should delete account successfully', async () => {
      const { DELETE } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts?id=1');
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when id is missing', async () => {
      const { DELETE } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts');
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('ID is required');
    });

    it('should return 401 when unauthorized', async () => {
      mockVerifyAuth.mockResolvedValueOnce({ authenticated: false });
      const { DELETE } = await import('@/app/api/wechat-accounts/route');
      const req = createRequest('http://localhost/api/wechat-accounts?id=1');
      const res = await DELETE(req);
      expect(res.status).toBe(401);
    });
  });
});
