import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { USER_AGENT } from '@/lib/wechat/proxy-request';

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('auth_key') || 
                  request.headers.get('x-auth-key');
  const keyword = request.nextUrl.searchParams.get('keyword');
  const begin = parseInt(request.nextUrl.searchParams.get('begin') || '0');
  const size = parseInt(request.nextUrl.searchParams.get('size') || '5');

  if (!authKey) {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: 'auth_key is required' },
    });
  }

  if (!keyword) {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: 'keyword不能为空' },
    });
  }

  const sessions = await db()
    .select()
    .from(wechatSessions)
    .where(eq(wechatSessions.authKey, authKey))
    .limit(1);

  if (sessions.length === 0 || sessions[0].status !== 'active') {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: '认证信息无效或已过期' },
    });
  }

  const session = sessions[0];

  try {
    const params = new URLSearchParams({
      action: 'search_biz',
      begin: begin.toString(),
      count: size.toString(),
      query: keyword,
      token: session.token,
      lang: 'zh_CN',
      f: 'json',
      ajax: '1',
    });

    const response = await fetch(
      `https://mp.weixin.qq.com/cgi-bin/searchbiz?${params.toString()}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': 'https://mp.weixin.qq.com/',
          'Cookie': session.cookies,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: '搜索公众号接口失败，请稍后重试' },
    });
  }
}
