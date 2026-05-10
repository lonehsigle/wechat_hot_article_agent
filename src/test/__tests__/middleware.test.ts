import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/session-signature-edge', () => ({
  verifySessionSignatureEdge: vi.fn().mockResolvedValue(false),
}));

function restoreEnvValue(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function createRequest(url: string, cookies: Record<string, string> = {}, headers?: HeadersInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, { headers }) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', {
    value: {
      pathname: parsedUrl.pathname,
      searchParams: parsedUrl.searchParams,
      clone: () => new URL(url),
    },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(req, 'cookies', {
    value: {
      get: (name: string) => (cookies[name] ? { value: cookies[name] } : undefined),
    },
    configurable: true,
    writable: true,
  });
  return req as NextRequest;
}

describe('middleware API auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects private API requests without a signed session', async () => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(createRequest('http://localhost/api/hot-topic-collect'));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      authenticated: false,
    });
  });

  it('keeps v1 auth-key API public for its own auth_key check', async () => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(createRequest('http://localhost/api/v1/account'));

    expect(res.status).toBe(200);
    expect((res as any).type).toBe('next');
  });

  it('rejects jobs API without session when worker token is not configured', async () => {
    const originalToken = process.env.INTERNAL_WORKER_TOKEN;
    delete process.env.INTERNAL_WORKER_TOKEN;

    vi.resetModules();
    const { middleware } = await import('@/middleware');
    const res = await middleware(createRequest('http://localhost/api/jobs'));

    expect(res.status).toBe(401);
    restoreEnvValue('INTERNAL_WORKER_TOKEN', originalToken);
  });

  it('allows jobs API with a valid configured worker token', async () => {
    const originalToken = process.env.INTERNAL_WORKER_TOKEN;
    process.env.INTERNAL_WORKER_TOKEN = 'test-worker-token';

    vi.resetModules();
    const { middleware } = await import('@/middleware');
    const res = await middleware(
      createRequest('http://localhost/api/jobs', {}, { 'x-internal-worker-token': 'test-worker-token' })
    );

    expect(res.status).toBe(200);
    expect((res as any).type).toBe('next');
    restoreEnvValue('INTERNAL_WORKER_TOKEN', originalToken);
  });
});
