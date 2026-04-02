import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { USER_AGENT } from '@/lib/wechat/proxy-request';

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('auth_key') || 
                  request.headers.get('x-auth-key');
  const fakeid = request.nextUrl.searchParams.get('fakeid');
  const keyword = request.nextUrl.searchParams.get('keyword') || '';
  const begin = parseInt(request.nextUrl.searchParams.get('begin') || '0');
  const size = parseInt(request.nextUrl.searchParams.get('size') || '5');

  if (!authKey) {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: 'auth_key is required' },
    });
  }

  if (!fakeid) {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: 'fakeid不能为空' },
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
  const isSearching = !!keyword;

  try {
    const params = new URLSearchParams({
      sub: isSearching ? 'search' : 'list',
      search_field: isSearching ? '7' : 'null',
      begin: begin.toString(),
      count: size.toString(),
      query: keyword,
      fakeid: fakeid,
      type: '101_1',
      free_publish_type: '1',
      sub_action: 'list_ex',
      token: session.token,
      lang: 'zh_CN',
      f: 'json',
      ajax: '1',
    });

    const response = await fetch(
      `https://mp.weixin.qq.com/cgi-bin/appmsgpublish?${params.toString()}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': 'https://mp.weixin.qq.com/',
          'Cookie': session.cookies,
        },
      }
    );

    const resp = await response.json();

    if (resp.base_resp && resp.base_resp.ret === 0) {
      const publish_page = JSON.parse(resp.publish_page);
      const articles = publish_page.publish_list
        .filter((item: { publish_info: string }) => !!item.publish_info)
        .flatMap((item: { publish_info: string }) => {
          const publish_info = JSON.parse(item.publish_info);
          return publish_info.appmsgex;
        });
      
      return NextResponse.json({
        base_resp: resp.base_resp,
        articles: articles,
        total: publish_page.total_count || articles.length,
      });
    }

    return NextResponse.json(resp);
  } catch (error) {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: '获取文章列表接口失败，请重试' },
    });
  }
}
