import { describe, it, expect, vi } from 'vitest';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/utils/api-response';

describe('api-response - successResponse', () => {
  it('returns success with default status', () => {
    const res = successResponse({ foo: 'bar' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('returns success with custom status', () => {
    const res = successResponse({ created: true }, 201);
    expect(res.status).toBe(201);
  });
});

describe('api-response - errorResponse', () => {
  it('returns error with default status', () => {
    const res = errorResponse('Something went wrong');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: 'Something went wrong' });
  });

  it('returns error with custom status', () => {
    const res = errorResponse('Not found', 404);
    expect(res.status).toBe(404);
  });
});

describe('api-response - withErrorHandler', () => {
  it('wraps successful handler', async () => {
    const handler = vi.fn().mockResolvedValue(successResponse({ ok: true }));
    const wrapped = withErrorHandler(handler);
    const res = await wrapped(new Request('http://localhost'));
    expect(res.body).toEqual({ success: true, data: { ok: true } });
  });

  it('catches errors and returns 500', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Boom'));
    const wrapped = withErrorHandler(handler);
    const res = await wrapped(new Request('http://localhost'));
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Boom');
  });
});
