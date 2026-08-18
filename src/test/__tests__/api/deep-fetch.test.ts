import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { fetchDeepContent } from '@/lib/crawler/service';

vi.mock('@/lib/crawler/service', () => ({
  fetchDeepContent: vi.fn(),
  batchFetchDeepContent: vi.fn(),
  formatContentForMaterial: vi.fn(),
}));

describe('/api/deep-fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects private URLs for preview before fetching', async () => {
    const { POST } = await import('@/app/api/deep-fetch/route');
    const request = new Request('http://localhost/api/deep-fetch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'preview', url: 'http://127.0.0.1/admin' }),
    });

    const response = await POST(request as unknown as NextRequest);

    expect(response.status).toBe(400);
    expect(fetchDeepContent).not.toHaveBeenCalled();
  });
});
