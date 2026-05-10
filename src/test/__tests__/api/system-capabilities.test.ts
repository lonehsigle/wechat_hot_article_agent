import { describe, it, expect } from 'vitest';

describe('/api/system/capabilities', () => {
  it('returns truthful capability and data-source contracts', async () => {
    const { GET } = await import('@/app/api/system/capabilities/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.summary.total).toBeGreaterThan(0);
    expect(data.capabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'analysis-worker',
          status: 'blocked',
        }),
        expect.objectContaining({
          id: 'manual-analytics-sync',
          status: 'ready',
        }),
        expect.objectContaining({
          id: 'wechat-draft-sync',
          status: 'ready',
        }),
      ])
    );
    expect(data.dataSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'demo-data',
          status: 'blocked',
        }),
      ])
    );
  });
});
