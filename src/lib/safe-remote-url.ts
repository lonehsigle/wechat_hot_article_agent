import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.');
  if (parts.length !== 4 || parts.some(part => !/^\d+$/.test(part))) return false;
  const octets = parts.map(Number);
  if (octets.some(octet => octet < 0 || octet > 255)) return true;

  const [first, second, third] = octets;
  return first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && (third === 0 || third === 2)) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224;
}

function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.includes(':')) return false;
  if (hostname === '::' || hostname === '::1') return true;

  const firstHextet = Number.parseInt(hostname.split(':')[0], 16);
  if ((firstHextet >= 0xfc00 && firstHextet <= 0xfdff) ||
      (firstHextet >= 0xfe80 && firstHextet <= 0xfebf) ||
      firstHextet >= 0xff00) return true;

  const dottedMappedMatch = hostname.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (dottedMappedMatch) return isPrivateIpv4(dottedMappedMatch[1]);

  const mappedMatch = hostname.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!mappedMatch) return false;
  const high = Number.parseInt(mappedMatch[1], 16);
  const low = Number.parseInt(mappedMatch[2], 16);
  return isPrivateIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
}

function isPrivateIpAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, '');
  return isPrivateIpv4(normalized) || isPrivateIpv6(normalized);
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    normalized.endsWith('.home.arpa') ||
    isPrivateIpv6(normalized) ||
    isPrivateIpv4(normalized);
}

export function assertSafeRemoteUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('无效的远程资源 URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('远程资源仅支持 HTTP 或 HTTPS');
  }
  if (url.username || url.password) {
    throw new Error('远程资源 URL 不允许包含认证信息');
  }
  if (isPrivateHostname(url.hostname)) {
    throw new Error('不允许访问本地或私有网络地址');
  }

  return url;
}

export async function assertSafeRemoteUrlResolved(value: string): Promise<URL> {
  const url = assertSafeRemoteUrl(value);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (isIP(hostname)) return url;

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error('无法解析远程资源地址');
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIpAddress(address))) {
    throw new Error('不允许访问解析到本地或私有网络的地址');
  }
  return url;
}
