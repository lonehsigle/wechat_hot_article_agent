import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { checkLock } from '@/lib/wechat-auth';

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

vi.mock('@/lib/wechat-auth', () => ({
  releaseLock: vi.fn(),
  cleanQRCode: vi.fn(),
  checkLock: vi.fn(() => false),
  setLock: vi.fn(),
  setAuthController: vi.fn(),
  getAuthController: vi.fn(),
  WechatAuthController: vi.fn().mockImplementation(function () {
    return {
      startBrowser: vi.fn(),
      generateQRCode: vi.fn(() => Promise.resolve('/qrcode.png')),
      waitForLogin: vi.fn(() => Promise.resolve(true)),
      extractSession: vi.fn(() => Promise.resolve({ cookiesStr: 'c=1', token: 't', expiry: { expiryTime: Date.now() + 100000 } })),
      close: vi.fn(),
    };
  }),
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

const originalFetch = global.fetch;
const originalSetTimeout = global.setTimeout;

describe('/api/wechat-collect', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    global.fetch = originalFetch;
    global.setTimeout = originalSetTimeout;
    vi.mocked(checkLock).mockReturnValue(false);
  });

  describe('GET', () => {
    it('should check auth status - authorized', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, status: 'active', expiresAt: new Date(Date.now() + 10000) }]);

      const req = createRequest('http://localhost/api/wechat-collect?action=check-auth');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.authorized).toBe(true);
    });

    it('should check auth status - not authorized', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/wechat-collect?action=check-auth');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.authorized).toBe(false);
    });

    it('should return 500 on database error for check-auth', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push(new Error('db fail'));

      const req = createRequest('http://localhost/api/wechat-collect?action=check-auth');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('db fail');
    });

    it('should list subscriptions', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([
        { id: 1, biz: 'biz1', name: 'Sub 1' },
      ]);

      const req = createRequest('http://localhost/api/wechat-collect?action=list-subscriptions');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.subscriptions).toHaveLength(1);
    });

    it('should list articles', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([
        { id: 1, title: 'Article 1', msgId: 'msg1' },
      ]);

      const req = createRequest('http://localhost/api/wechat-collect?action=list-articles');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.articles).toHaveLength(1);
    });

    it('should list articles with subscriptionId', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([
        { id: 1, title: 'Article 1', msgId: 'msg1', subscriptionId: 1 },
      ]);

      const req = createRequest('http://localhost/api/wechat-collect?action=list-articles&subscriptionId=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.articles).toHaveLength(1);
    });

    it('should return 400 for invalid subscriptionId', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect?action=list-articles&subscriptionId=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid subscriptionId');
    });

    it('should return 500 on database error when listing articles', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push(new Error('db fail'));

      const req = createRequest('http://localhost/api/wechat-collect?action=list-articles');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('db fail');
    });

    it('should list tasks', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([
        { id: 1, status: 'completed', subscriptionId: 1 },
      ]);

      const req = createRequest('http://localhost/api/wechat-collect?action=list-tasks');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
    });

    it('should clear lock', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect?action=clear-lock');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should start qrcode auth', async () => {
      global.setTimeout = vi.fn((fn: any) => { if (typeof fn === 'function') fn(); return 0 as any; }) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest('http://localhost/api/wechat-collect?action=start-qrcode-auth');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.qrcodeUrl).toBe('/wx_qrcode.png');
      expect(data.expiresIn).toBe(120);
    });

    it('should return 400 when qrcode auth is already running', async () => {
      global.setTimeout = vi.fn((fn: any) => { if (typeof fn === 'function') fn(); return 0 as any; }) as any;
      vi.mocked(checkLock).mockReturnValue(true);
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest('http://localhost/api/wechat-collect?action=start-qrcode-auth');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('授权流程正在运行');
    });

    it('should get qrcode', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, token: 'tok123' }]);

      const req = createRequest('http://localhost/api/wechat-collect?action=get-qrcode');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.qrcodeUrl).toContain('/api/wechat-collect/auth?token=');
      expect(data.expiresIn).toBe(120);
    });

    it('should return 400 when check-scan-status missing token', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect?action=check-scan-status');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('token is required');
    });

    it('should return expired when check-scan-status token not found', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/wechat-collect?action=check-scan-status&token=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('expired');
      expect(data.message).toContain('二维码已过期');
    });

    it('should return success when check-scan-status is active', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, token: 'abc', status: 'active' }]);

      const req = createRequest('http://localhost/api/wechat-collect?action=check-scan-status&token=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.message).toContain('授权成功');
    });

    it('should return waiting when check-scan-status is pending', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, token: 'abc', status: 'pending' }]);

      const req = createRequest('http://localhost/api/wechat-collect?action=check-scan-status&token=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('waiting');
      expect(data.message).toContain('等待扫码');
    });

    it('should return expired for unknown auth status in check-scan-status', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, token: 'abc', status: 'inactive' }]);

      const req = createRequest('http://localhost/api/wechat-collect?action=check-scan-status&token=abc');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('expired');
    });

    it('should return 400 when get-account-info missing cookie', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect?action=get-account-info');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('cookie is required');
    });

    it('should get account info successfully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          text: () => Promise.resolve('nickname:"TestUser",head_img:"http://img.jpg"'),
        })
      ) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest('http://localhost/api/wechat-collect?action=get-account-info&cookie=test');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.nickname).toBe('TestUser');
      expect(data.avatar).toBe('http://img.jpg');
    });

    it('should return 400 when get-account-info cannot parse nickname', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          text: () => Promise.resolve('some html without nickname match'),
        })
      ) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest('http://localhost/api/wechat-collect?action=get-account-info&cookie=test');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('无法获取账号信息');
    });

    it('should return 500 when get-account-info fetch fails', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('network error'))) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest('http://localhost/api/wechat-collect?action=get-account-info&cookie=test');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('获取账号信息失败');
    });

    it('should return 400 when get-article-info missing url', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect?action=get-article-info');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('url is required');
    });

    it('should get article info successfully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          text: () =>
            Promise.resolve(
              'var biz="biz123";var nickname="Nick";var msg_title="Title";var msg_desc="Desc";'
            ),
        })
      ) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest(
        'http://localhost/api/wechat-collect?action=get-article-info&url=http://mp.weixin.qq.com/s/test'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.biz).toBe('biz123');
      expect(data.nickname).toBe('Nick');
      expect(data.articleTitle).toBe('Title');
      expect(data.articleDesc).toBe('Desc');
    });

    it('should return 400 when get-article-info cannot parse', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          text: () => Promise.resolve('no biz or nickname here'),
        })
      ) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest(
        'http://localhost/api/wechat-collect?action=get-article-info&url=http://mp.weixin.qq.com/s/test'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('无法解析文章链接');
    });

    it('should return 500 when get-article-info fetch fails', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('fetch fail'))) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest(
        'http://localhost/api/wechat-collect?action=get-article-info&url=http://mp.weixin.qq.com/s/test'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('解析文章链接失败');
    });

    it('should return 400 when search-biz missing query or cookie', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req1 = createRequest('http://localhost/api/wechat-collect?action=search-biz');
      const res1 = await GET(req1);
      const data1 = await res1.json();
      expect(res1.status).toBe(400);
      expect(data1.error).toContain('query and cookie are required');

      const req2 = createRequest('http://localhost/api/wechat-collect?action=search-biz&query=test');
      const res2 = await GET(req2);
      const data2 = await res2.json();
      expect(res2.status).toBe(400);
      expect(data2.error).toContain('query and cookie are required');
    });

    it('should search biz successfully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              base_resp: { ret: 0 },
              publish_page: {
                search_result: {
                  result: [
                    {
                      fakeid: 'biz1',
                      nickname: 'Name1',
                      alias: 'alias1',
                      round_head_img: 'img1',
                      signature: 'sig1',
                    },
                  ],
                },
              },
            }),
        })
      ) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest(
        'http://localhost/api/wechat-collect?action=search-biz&query=test&cookie=token=123'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].biz).toBe('biz1');
      expect(data.results[0].name).toBe('Name1');
    });

    it('should return 500 when search-biz fails', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              base_resp: { ret: -1, err_msg: 'search failed' },
            }),
        })
      ) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');

      const req = createRequest(
        'http://localhost/api/wechat-collect?action=search-biz&query=test&cookie=token=123'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('search failed');
    });

    it('should return 400 when collect-article-by-url missing url', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect?action=collect-article-by-url');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('url is required');
    });

    it('should collect article by url successfully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          status: 200,
          text: () =>
            Promise.resolve(
              'var biz="biz123";var nickname="TestNick";var msg_title="Test Title";var msg_desc="Test Desc";var msg_link="http://cover.jpg";var ct="1609459200";<div id="js_content">content html</div>'
            ),
        })
      ) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, cookie: 'c=1' }]);
      mockDbQueue.push([{ id: 5, biz: 'biz123' }]);
      mockDbQueue.push([{ id: 10, title: 'Test Title' }]);
      mockDbQueue.push([{ id: 20 }]);

      const req = createRequest(
        'http://localhost/api/wechat-collect?action=collect-article-by-url&url=https://mp.weixin.qq.com/s/abc123'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.article.title).toBe('Test Title');
    });

    it('should return 500 when collect-article-by-url fails', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('fetch failed'))) as any;
      const { GET } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, cookie: 'c=1' }]);

      const req = createRequest(
        'http://localhost/api/wechat-collect?action=collect-article-by-url&url=https://mp.weixin.qq.com/s/abc123'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('fetch failed');
    });

    it('should return 400 for invalid action', async () => {
      const { GET } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect?action=unknown');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });
  });

  describe('POST', () => {
    it('should init auth successfully', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, token: 'tok123' }]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'init-auth' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
    });

    it('should return 500 on database error for POST', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push(new Error('db fail'));

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'init-auth' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('db fail');
    });

    it('should complete auth successfully', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, token: 'tok', status: 'active' }]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({
          action: 'complete-auth',
          token: 'tok',
          cookie: 'c',
          nickname: 'n',
          avatar: 'a',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.auth.status).toBe('active');
    });

    it('should add subscription successfully', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([]); // no existing
      mockDbQueue.push([{ id: 1, biz: 'biz1', name: 'New Sub' }]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'add-subscription', biz: 'biz1', name: 'New Sub' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscription.id).toBe(1);
    });

    it('should return 400 when subscription already exists', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, biz: 'biz1' }]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'add-subscription', biz: 'biz1', name: 'New Sub' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('已添加');
    });

    it('should update subscription successfully', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, monitorEnabled: true, monitorInterval: 30 }]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update-subscription',
          id: 1,
          monitorEnabled: true,
          monitorInterval: 30,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscription.monitorEnabled).toBe(true);
    });

    it('should delete subscription successfully', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-subscription', id: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when delete missing id', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-subscription' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少订阅ID');
    });

    it('should return 400 for invalid JSON body', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: 'not json',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid JSON body');
    });

    it('should return 400 when start-collect missing subscriptionId', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'start-collect' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少订阅ID');
    });

    it('should return 404 when subscription not found', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'start-collect', subscriptionId: 999 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('Subscription not found');
    });

    it('should return 400 when no active auth for start-collect', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, biz: 'biz1' }]);
      mockDbQueue.push([]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'start-collect', subscriptionId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('请先完成微信授权');
    });

    it('should start collect successfully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              base_resp: { ret: 0 },
              publish_page: {
                publish_list: [
                  {
                    publish_info: JSON.stringify({
                      appmsgex: [
                        {
                          app_id: 'msg1',
                          title: 'Test Article',
                          author: 'Author',
                          digest: 'Digest',
                          cover: 'cover.jpg',
                          link: 'http://link',
                          update_time: 1609459200,
                          read_num: 100,
                          like_num: 10,
                        },
                      ],
                    }),
                  },
                ],
              },
            }),
        })
      ) as any;

      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, biz: 'biz1', totalArticles: 0 }]);
      mockDbQueue.push([{ id: 2, cookie: 'token=123' }]);
      mockDbQueue.push([{ id: 3, status: 'pending', subscriptionId: 1, type: 'incremental', totalArticles: 5 }]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'start-collect', subscriptionId: 1, count: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.collected).toBe(1);
      expect(data.task.status).toBe('completed');
    });

    it('should return 500 when fetch fails during start-collect', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('fetch error'))) as any;

      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, biz: 'biz1', totalArticles: 0 }]);
      mockDbQueue.push([{ id: 2, cookie: 'token=123' }]);
      mockDbQueue.push([{ id: 3, status: 'pending' }]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'start-collect', subscriptionId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('fetch error');
    });

    it('should save article successfully', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([{ id: 1, msgId: 'msg1', title: 'Title' }]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save-article',
          msgId: 'msg1',
          title: 'Title',
          sourceUrl: 'http://example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.article.msgId).toBe('msg1');
    });

    it('should return 400 when update-article missing id', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'update-article', content: 'updated' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少文章ID');
    });

    it('should update article successfully with engagement rate', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      mockDbQueue.push([
        {
          id: 1,
          content: 'updated',
          readCount: 100,
          likeCount: 10,
          commentCount: 5,
          recommendCount: 2,
          shareCount: 3,
          engagementRate: 20,
        },
      ]);

      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update-article',
          id: 1,
          content: 'updated',
          readCount: 100,
          likeCount: 10,
          commentCount: 5,
          recommendCount: 2,
          shareCount: 3,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.article.engagementRate).toBe(20);
    });

    it('should delete article successfully', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-article', id: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when delete article missing id', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-article' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('缺少文章ID');
    });

    it('should return 400 for unknown action', async () => {
      const { POST } = await import('@/app/api/wechat-collect/route');
      const req = createRequest('http://localhost/api/wechat-collect', {
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
