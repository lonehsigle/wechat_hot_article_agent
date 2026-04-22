import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { proxyMpRequest, extractTokenFromRedirectUrl, USER_AGENT } from '@/lib/wechat/proxy-request';

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'getqrcode':
        return await getQrcode();
      case 'scan':
        return await checkScan(request);
      case 'login':
        return await checkLogin(request);
      case 'search':
        return await searchAccount(request);
      case 'articles':
        return await getArticles(request);
      case 'info':
        return await getAccountInfo(request);
      case 'status':
        return await getStatus(request);
      case 'logout':
        return await logout(request);
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('WeChat API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function getQrcode() {
  const response = await fetch(
    `https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=getqrcode&random=${Date.now()}`,
    {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://mp.weixin.qq.com/',
      },
    }
  );

  const setCookie = response.headers.get('set-cookie') || '';
  const uuidMatch = setCookie.match(/uuid=([^;]+)/);
  const uuid = uuidMatch ? uuidMatch[1] : '';

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  return NextResponse.json({
    success: true,
    qrcode: `data:image/png;base64,${base64}`,
    uuid,
    setCookie,
  });
}

async function checkScan(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get('uuid');
  const setCookie = request.nextUrl.searchParams.get('cookie') || '';
  
  if (!uuid) {
    return NextResponse.json({ success: false, error: 'uuid is required' }, { status: 400 });
  }

  const response = await fetch(
    'https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=ask&token=&lang=zh_CN&f=json&ajax=1',
    {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://mp.weixin.qq.com/',
        'Cookie': setCookie || `uuid=${uuid}`,
      },
    }
  );

  const data = await response.json();
  return NextResponse.json(data);
}

async function checkLogin(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get('uuid');
  const setCookie = request.nextUrl.searchParams.get('cookie') || '';
  
  if (!uuid) {
    return NextResponse.json({ success: false, error: 'uuid is required' }, { status: 400 });
  }

  const response = await fetch(
    `https://mp.weixin.qq.com/cgi-bin/bizlogin?action=login`,
    {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://mp.weixin.qq.com/',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': setCookie || `uuid=${uuid}`,
      },
      body: new URLSearchParams({
        userlang: 'zh_CN',
        redirect_url: '',
        cookie_forbidden: '0',
        cookie_cleaned: '0',
        plugin_used: '0',
        login_type: '3',
        token: '',
        lang: 'zh_CN',
        f: 'json',
        ajax: '1',
      }).toString(),
    }
  );

  const setCookies = response.headers.getSetCookie();
  const data = await response.json();

  if (data.redirect_url) {
    const token = extractTokenFromRedirectUrl(data.redirect_url);
    
    if (token) {
      const authKey = crypto.randomUUID().replace(/-/g, '');
      const cookieString = setCookies
        .map(c => c.split(';')[0])
        .filter(Boolean)
        .join('; ');

      await db().insert(wechatSessions).values({
        authKey,
        token,
        cookies: cookieString,
        status: 'active',
        expiresAt: new Date(Date.now() + FOUR_DAYS_MS),
      });

      const accountInfo = await getAccountInfoByToken(token, cookieString);

      return NextResponse.json({
        success: true,
        authKey,
        token,
        nickname: accountInfo.nickname,
        avatar: accountInfo.avatar,
        expiresAt: new Date(Date.now() + FOUR_DAYS_MS).toISOString(),
      });
    }
  }

  return NextResponse.json(data);
}

async function getAccountInfoByToken(token: string, cookies: string): Promise<{ nickname: string; avatar: string }> {
  try {
    const response = await fetch(
      `https://mp.weixin.qq.com/cgi-bin/home?t=home/index&token=${token}&lang=zh_CN`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': 'https://mp.weixin.qq.com/',
          'Cookie': cookies,
        },
      }
    );

    const html = await response.text();
    
    let nickname = '';
    const nicknameMatch = html.match(/wx\.cgiData\.nick_name\s*=\s*"([^"]+)"/);
    if (nicknameMatch) {
      nickname = nicknameMatch[1];
    }

    let avatar = '';
    const avatarMatch = html.match(/wx\.cgiData\.head_img\s*=\s*"([^"]+)"/);
    if (avatarMatch) {
      avatar = avatarMatch[1];
    }

    return { nickname, avatar };
  } catch {
    return { nickname: '', avatar: '' };
  }
}

async function searchAccount(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('authKey');
  const keyword = request.nextUrl.searchParams.get('keyword');
  const begin = request.nextUrl.searchParams.get('begin') || '0';
  const count = request.nextUrl.searchParams.get('count') || '5';

  if (!authKey || !keyword) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'authKey and keyword are required' } 
    }, { status: 400 });
  }

  const session = await getSession(authKey);
  if (!session) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: '未登录或登录已过期，请重新扫码登录' } 
    }, { status: 401 });
  }

  const response = await fetch(
    `https://mp.weixin.qq.com/cgi-bin/searchbiz?action=search_biz&begin=${begin}&count=${count}&query=${encodeURIComponent(keyword)}&token=${session.token}&lang=zh_CN&f=json&ajax=1`,
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
}

async function getArticles(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('authKey');
  const fakeid = request.nextUrl.searchParams.get('fakeid');
  const begin = request.nextUrl.searchParams.get('begin') || '0';
  const count = request.nextUrl.searchParams.get('count') || '5';
  const query = request.nextUrl.searchParams.get('query') || '';

  if (!authKey || !fakeid) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'authKey and fakeid are required' } 
    }, { status: 400 });
  }

  const session = await getSession(authKey);
  if (!session) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: '未登录或登录已过期，请重新扫码登录' } 
    }, { status: 401 });
  }

  const isSearching = !!query;
  const params = new URLSearchParams({
    sub: isSearching ? 'search' : 'list',
    search_field: isSearching ? '7' : 'null',
    begin,
    count,
    query,
    fakeid,
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

  const data = await response.json();

  if (data.base_resp && data.base_resp.ret === 0 && data.publish_page) {
    try {
      const publishPage = JSON.parse(data.publish_page);
      const articles = publishPage.publish_list
        ?.filter((item: { publish_info: string }) => item.publish_info)
        ?.flatMap((item: { publish_info: string }) => {
          const publishInfo = JSON.parse(item.publish_info);
          return publishInfo.appmsgex || [];
        }) || [];

      return NextResponse.json({
        success: true,
        articles,
        total: publishPage.total_count || 0,
      });
    } catch {
      return NextResponse.json(data);
    }
  }

  return NextResponse.json(data);
}

async function getAccountInfo(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('authKey');
  
  if (!authKey) {
    return NextResponse.json({ nickname: '', avatar: '' });
  }

  const session = await getSession(authKey);
  if (!session) {
    return NextResponse.json({ nickname: '', avatar: '' });
  }

  return NextResponse.json({
    nickname: session.nickname || '',
    avatar: session.avatar || '',
  });
}

async function getStatus(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('authKey');
  
  if (!authKey) {
    return NextResponse.json({ loggedIn: false });
  }

  const session = await getSession(authKey);
  if (!session) {
    return NextResponse.json({ loggedIn: false });
  }

  if (session.expiresAt && new Date() > session.expiresAt) {
    await db().delete(wechatSessions).where(eq(wechatSessions.authKey, authKey));
    return NextResponse.json({ loggedIn: false, reason: 'Session expired' });
  }

  return NextResponse.json({ 
    loggedIn: true,
    authKey,
    nickname: session.nickname,
    avatar: session.avatar,
  });
}

async function logout(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('authKey');
  
  if (!authKey) {
    return NextResponse.json({ success: false });
  }

  await db().delete(wechatSessions).where(eq(wechatSessions.authKey, authKey));
  return NextResponse.json({ success: true });
}

async function getSession(authKey: string) {
  const sessions = await db()
    .select()
    .from(wechatSessions)
    .where(eq(wechatSessions.authKey, authKey))
    .limit(1);
  
  return sessions[0] || null;
}
