import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockDbQueue: unknown[] = [];

const mockDb: Record<PropertyKey, unknown> = new Proxy({}, {
  get(_, prop) {
    if (prop === 'then') {
      return (resolve: (value: unknown) => void) => resolve(mockDbQueue.shift() ?? []);
    }
    return () => mockDb;
  },
});

vi.mock('@/lib/db', () => ({
  db: () => mockDb,
}));

describe('/api/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueue = [];
  });

  it('returns aggregate counts without loading article or task rows', async () => {
    mockDbQueue.push([
      { totalArticles: 12, publishedArticles: 7, drafts: 5 },
    ]);
    mockDbQueue.push([{ analysisTasks: 3 }]);

    const { GET } = await import('@/app/api/dashboard/route');
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      totalArticles: 12,
      publishedArticles: 7,
      drafts: 5,
      analysisTasks: 3,
    });
  });
});
