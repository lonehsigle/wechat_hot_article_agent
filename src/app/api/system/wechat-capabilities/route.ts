import { NextRequest, NextResponse } from 'next/server';
import { inspectWechatAccountCapabilities } from '@/lib/wechat/capabilities';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = Number(searchParams.get('accountId') || '1');
  const live = searchParams.get('live') === 'true';

  if (!Number.isInteger(accountId) || accountId < 1) {
    return NextResponse.json({ success: false, error: 'Invalid accountId' }, { status: 400 });
  }

  const report = await inspectWechatAccountCapabilities(accountId, { live });
  if (!report) {
    return NextResponse.json({ success: false, error: '公众号账号不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true, ...report });
}
