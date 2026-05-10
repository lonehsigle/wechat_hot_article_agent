import { NextRequest, NextResponse } from 'next/server';
import { verifySessionSignatureEdge } from '@/lib/session-signature-edge';

const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/v1',
];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedPath(pathname: string): boolean {
  return pathname === '/app' || pathname.startsWith('/app/') || pathname.startsWith('/api/');
}

function hasValidInternalWorkerToken(request: NextRequest): boolean {
  const expectedToken = process.env.INTERNAL_WORKER_TOKEN;
  if (!expectedToken) return false;
  const receivedToken = request.headers.get('x-internal-worker-token');
  return receivedToken === expectedToken;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname) || isPublicApi(pathname)) {
    return NextResponse.next();
  }

  if ((pathname === '/api/jobs' || pathname.startsWith('/api/jobs/')) && hasValidInternalWorkerToken(request)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  const signature = request.cookies.get('auth_sig')?.value;
  if (await verifySessionSignatureEdge(token, signature)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: '请先登录', authenticated: false },
      { status: 401 }
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/app/:path*', '/api/:path*'],
};
