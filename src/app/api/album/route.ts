import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { USER_AGENT } from '@/lib/wechat/proxy-request';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'get':
        return await getAlbum(request);
      case 'list':
        return await getAlbumList(request);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Album API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function getSession(authKey: string) {
  const sessions = await db()
    .select()
    .from(wechatSessions)
    .where(eq(wechatSessions.authKey, authKey))
    .limit(1);
  
  return sessions[0] || null;
}

interface AlbumArticle {
  title: string;
  url: string;
  cover: string;
  createTime: number;
  author: string;
  digest: string;
}

interface AlbumInfo {
  albumId: string;
  title: string;
  desc: string;
  cover: string;
  articleCount: number;
  articles: AlbumArticle[];
}

async function getAlbum(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('authKey');
  const fakeid = request.nextUrl.searchParams.get('fakeid');
  const albumId = request.nextUrl.searchParams.get('album_id');
  const beginMsgid = request.nextUrl.searchParams.get('begin_msgid') || '';
  const beginItemidx = request.nextUrl.searchParams.get('begin_itemidx') || '';
  const count = parseInt(request.nextUrl.searchParams.get('count') || '20');
  const isReverse = request.nextUrl.searchParams.get('is_reverse') || '0';

  if (!albumId) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'album_id 不能为空' } 
    }, { status: 400 });
  }

  let cookies = '';
  if (authKey) {
    const session = await getSession(authKey);
    if (session) {
      cookies = session.cookies;
    }
  }

  const params = new URLSearchParams({
    action: 'getalbum',
    __biz: fakeid || '',
    album_id: albumId,
    begin_msgid: beginMsgid,
    begin_itemidx: beginItemidx,
    count: count.toString(),
    is_reverse: isReverse,
    f: 'json',
  });

  const response = await fetch(
    `https://mp.weixin.qq.com/mp/appmsgalbum?${params.toString()}`,
    {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://mp.weixin.qq.com/',
        'Cookie': cookies,
      },
    }
  );

  const data = await response.json();

  if (data.base_resp && data.base_resp.ret === 0 && data.getalbum_resp) {
    const albumResp = data.getalbum_resp;
    
    const articles: AlbumArticle[] = (albumResp.getalbum_page || []).map((item: {
      title: string;
      url: string;
      cover: string;
      create_time: number;
      author: string;
      digest: string;
    }) => ({
      title: item.title,
      url: item.url,
      cover: item.cover,
      createTime: item.create_time,
      author: item.author,
      digest: item.digest,
    }));

    const albumInfo: AlbumInfo = {
      albumId: albumId,
      title: albumResp.title || '',
      desc: albumResp.desc || '',
      cover: albumResp.cover || '',
      articleCount: albumResp.article_count || articles.length,
      articles,
    };

    return NextResponse.json({
      success: true,
      album: albumInfo,
    });
  }

  return NextResponse.json(data);
}

async function getAlbumList(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('authKey');
  const fakeid = request.nextUrl.searchParams.get('fakeid');

  if (!authKey || !fakeid) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'authKey 和 fakeid 不能为空' } 
    }, { status: 400 });
  }

  const session = await getSession(authKey);
  if (!session) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: '未登录或登录已过期' } 
    }, { status: 401 });
  }

  const response = await fetch(
    `https://mp.weixin.qq.com/cgi-bin/appmsg?action=get_album_list&fakeid=${fakeid}&token=${session.token}&lang=zh_CN&f=json&ajax=1`,
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
