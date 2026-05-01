import { createHmac, timingSafeEqual } from 'crypto';

const SIGNATURE_VERSION = 'v1';

function getSignatureSecret(): string {
  if (process.env.AUTH_COOKIE_SECRET) return process.env.AUTH_COOKIE_SECRET;
  if (process.env.DB_ENCRYPTION_KEY) return process.env.DB_ENCRYPTION_KEY;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('生产环境必须设置 AUTH_COOKIE_SECRET 或 DB_ENCRYPTION_KEY');
  }
  return 'content-monitor-dev-auth-secret';
}

function signToken(token: string): string {
  return createHmac('sha256', getSignatureSecret()).update(token).digest('base64url');
}

export function createSessionSignature(token: string): string {
  return `${SIGNATURE_VERSION}.${signToken(token)}`;
}

export function verifySessionSignature(token: string | undefined, signature: string | undefined): boolean {
  if (!token || !signature) return false;
  const [version, received] = signature.split('.');
  if (version !== SIGNATURE_VERSION || !received) return false;

  const expected = signToken(token);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
