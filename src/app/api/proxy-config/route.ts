import { NextRequest, NextResponse } from 'next/server';
import { getProxyConfig, setProxyConfig, ProxyConfig } from '@/lib/wechat/proxy-config';

export async function GET() {
  const config = getProxyConfig();
  return NextResponse.json({
    success: true,
    config,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: Partial<ProxyConfig> = await request.json();
    const config = setProxyConfig(body);
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}
