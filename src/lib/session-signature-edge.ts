const SIGNATURE_VERSION = 'v1';

function getSignatureSecret(): string {
  return (
    process.env.AUTH_COOKIE_SECRET ||
    process.env.DB_ENCRYPTION_KEY ||
    'content-monitor-dev-auth-secret'
  );
}

async function signToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSignatureSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(token));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function verifySessionSignatureEdge(
  token: string | undefined,
  signature: string | undefined
): Promise<boolean> {
  if (!token || !signature) return false;
  const [version, received] = signature.split('.');
  if (version !== SIGNATURE_VERSION || !received) return false;
  const expected = await signToken(token);
  return expected === received;
}
