import { AccountCookie } from './cookie-store';

export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';

export interface ProxyRequestOptions {
  method: 'GET' | 'POST';
  endpoint: string;
  query?: Record<string, string | number>;
  body?: Record<string, string | number>;
  cookie?: string;
}

export async function proxyMpRequest(options: ProxyRequestOptions): Promise<Response> {
  const headers = new Headers({
    Referer: 'https://mp.weixin.qq.com/',
    Origin: 'https://mp.weixin.qq.com',
    'User-Agent': USER_AGENT,
    'Accept-Encoding': 'identity',
  });

  if (options.cookie) {
    headers.set('Cookie', options.cookie);
  }

  const requestInit: RequestInit = {
    method: options.method,
    headers: headers,
    redirect: 'follow',
  };

  let url = options.endpoint;
  if (options.query) {
    url += '?' + new URLSearchParams(
      Object.entries(options.query).map(([k, v]) => [k, String(v)])
    ).toString();
  }

  if (options.method === 'POST' && options.body) {
    requestInit.body = new URLSearchParams(
      Object.entries(options.body).map(([k, v]) => [k, String(v)])
    ).toString();
  }

  const response = await fetch(url, requestInit);
  return response;
}

export function parseCookiesFromSetCookie(setCookies: string[]): string {
  return setCookies
    .map(cookie => {
      const [nameValue] = cookie.split(';');
      return nameValue?.trim() || '';
    })
    .filter(Boolean)
    .join('; ');
}

export function extractTokenFromRedirectUrl(redirectUrl: string): string | null {
  try {
    const url = new URL(`http://localhost${redirectUrl}`);
    return url.searchParams.get('token');
  } catch {
    return null;
  }
}
