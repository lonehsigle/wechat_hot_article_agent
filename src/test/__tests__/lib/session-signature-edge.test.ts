import { afterEach, describe, expect, it } from 'vitest';
import { verifySessionSignatureEdge } from '@/lib/session-signature-edge';
import { createSessionSignature } from '@/lib/session-signature';

const originalNodeEnv = process.env.NODE_ENV;
const originalAuthSecret = process.env.AUTH_COOKIE_SECRET;
const originalEncryptionKey = process.env.DB_ENCRYPTION_KEY;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalAuthSecret === undefined) delete process.env.AUTH_COOKIE_SECRET;
  else process.env.AUTH_COOKIE_SECRET = originalAuthSecret;
  if (originalEncryptionKey === undefined) delete process.env.DB_ENCRYPTION_KEY;
  else process.env.DB_ENCRYPTION_KEY = originalEncryptionKey;
});

describe('edge session signatures', () => {
  it('rejects missing production signing secrets instead of using a development fallback', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_COOKIE_SECRET;
    delete process.env.DB_ENCRYPTION_KEY;

    await expect(verifySessionSignatureEdge('token', 'v1.signature')).rejects.toThrow(
      '生产环境必须设置 AUTH_COOKIE_SECRET 或 DB_ENCRYPTION_KEY'
    );
  });

  it('verifies Node-generated signatures and rejects malformed values', async () => {
    process.env.NODE_ENV = 'test';
    process.env.AUTH_COOKIE_SECRET = 'test-auth-secret';
    const signature = createSessionSignature('token');

    await expect(verifySessionSignatureEdge('token', signature)).resolves.toBe(true);
    await expect(verifySessionSignatureEdge('other-token', signature)).resolves.toBe(false);
    await expect(verifySessionSignatureEdge('token', 'v1.not-base64!')).resolves.toBe(false);
  });
});
