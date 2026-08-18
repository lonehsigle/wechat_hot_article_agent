import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockDbQueue: any[] = [];
let mockDbDefault: any = [];
let mockInsertValues: any[] = [];

const mockDb = new Proxy({} as any, {
  get(_, prop) {
    if (prop === 'then') {
      return (resolve: any, reject: any) => {
        const value = mockDbQueue.length > 0 ? mockDbQueue.shift() : mockDbDefault;
        if (value instanceof Error) reject(value);
        else Promise.resolve(value).then(resolve, reject);
      };
    }
    if (prop === 'values') {
      return (values: any) => {
        mockInsertValues.push(values);
        return mockDb;
      };
    }
    return () => mockDb;
  },
});

vi.mock('@/lib/db', () => ({
  db: () => mockDb,
}));
const jsonResponse = (body: unknown) => new Response(JSON.stringify(body), {
  headers: { 'Content-Type': 'application/json' },
});

describe('wechat datacube sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
    mockInsertValues = [];
    vi.stubGlobal('fetch', vi.fn());
  });

  it('syncs daily datacube stats into article_stats_daily with explainable status', async () => {
    mockDbQueue.push([
      {
        id: 1,
        title: 'Article',
        wechatAccountId: 1,
        wechatMediaId: 'msg-1',
        publishStatus: 'published',
      },
    ]);
    mockDbQueue.push([
      { id: 1, appId: 'appid', appSecret: 'secret', accessToken: 'token', tokenExpiresAt: new Date(Date.now() + 3600_000) },
    ]);
    mockDbQueue.push([
      { id: 1, appId: 'appid', appSecret: 'secret', accessToken: 'token', tokenExpiresAt: new Date(Date.now() + 3600_000) },
    ]);
    mockDbQueue.push([
      { id: 1, appId: 'appid', appSecret: 'secret', accessToken: 'token', tokenExpiresAt: new Date(Date.now() + 3600_000) },
    ]);
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(jsonResponse({
        list: [
          {
            msgid: 'msg-1',
            int_page_read_count: 10,
            share_count: 2,
            add_to_fav_count: 1,
          },
        ],
      }))
      .mockResolvedValueOnce(jsonResponse({ list: [] }))
      .mockResolvedValueOnce(jsonResponse({ list: [] }));

    const { syncDatacubeDailyStats } = await import('@/lib/wechat/service');
    const result = await syncDatacubeDailyStats({ date: '2026-05-09', force: true });

    expect(result.success).toBe(true);
    expect(result.synced).toBe(1);
    expect(result.details[0].status).toBe('synced');
    expect(mockInsertValues[0]).toMatchObject({
      articleId: 1,
      date: '2026-05-09',
      totalRead: 10,
      totalShare: 2,
      totalCollect: 1,
    });
  });
});
