const SIGNATURE_VERSION = 'v1';

function getSignatureSecret(): string {
  if (process.env.AUTH_COOKIE_SECRET) return process.env.AUTH_COOKIE_SECRET;
  if (process.env.DB_ENCRYPTION_KEY) return process.env.DB_ENCRYPTION_KEY;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('生产环境必须设置 AUTH_COOKIE_SECRET 或 DB_ENCRYPTION_KEY');
  }
  return 'content-monitor-dev-auth-secret';
}

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSignatureSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

function decodeBase64Url(value: string): ArrayBuffer | null {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const bytes = Uint8Array.from(decoded, character => character.charCodeAt(0));
    return bytes.buffer;
  } catch {
    return null;
  }
}

export async function verifySessionSignatureEdge(
  token: string | undefined,
  signature: string | undefined
): Promise<boolean> {
  if (!token || !signature) return false;
  const [version, received] = signature.split('.');
  if (version !== SIGNATURE_VERSION || !received) return false;
  const key = await getSigningKey();
  const receivedBytes = decodeBase64Url(received);
  if (!receivedBytes || receivedBytes.byteLength !== 32) return false;

  return crypto.subtle.verify(
    'HMAC',
    key,
    receivedBytes,
    new TextEncoder().encode(token)
  );
}
