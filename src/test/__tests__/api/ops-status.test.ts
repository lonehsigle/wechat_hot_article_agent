import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    return () => mockDb;
  },
});

vi.mock('@/lib/db', () => ({
  db: () => mockDb,
}));

describe('/api/ops/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
    mockDbDefault = [];
  });

  it('aggregates database, capability, job and analytics status', async () => {
    mockDbQueue.push([]); // select 1
    mockDbQueue.push([]); // latest stats
    mockDbQueue.push([{ jobName: 'syncArticleStats', status: 'succeeded', finishedAt: new Date() }]); // recent job runs

    const { GET } = await import('@/app/api/ops/status/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('warning');
    expect(data.analyticsSync).toMatchObject({
      needsSync: true,
      syncEndpoint: '/api/analytics/sync',
      jobName: 'syncArticleStats',
    });
    expect(data.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'syncArticleStats' }),
      ])
    );
    expect(data.jobRuns.recent[0]).toMatchObject({
      jobName: 'syncArticleStats',
      status: 'succeeded',
    });
    expect(data.warnings.length).toBeGreaterThan(0);
  });
});
