import { NextRequest, NextResponse } from 'next/server';
import { USER_AGENT } from '@/lib/wechat/proxy-request';
import { 
  getWxdownConfig, 
  getCredentials, 
  parseSetCookieHeader,
  extractCredentialParams 
} from '@/lib/wechat/wxdown-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'get':
        return await getComments(request);
      case 'config':
        return await getWxdownConfigAPI();
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Comment API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'config':
        return await setWxdownConfigAPI(request);
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Comment API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function getWxdownConfigAPI() {
  const config = getWxdownConfig();
  return NextResponse.json({ success: true, config });
}

async function setWxdownConfigAPI(request: NextRequest) {
  const body = await request.json();
  const { setWxdownConfig } = await import('@/lib/wechat/wxdown-service');
  const config = setWxdownConfig(body);
  return NextResponse.json({ success: true, config });
}

interface Comment {
  id: string;
  content: string;
  author: string;
  avatar: string;
  createTime: number;
  likeCount: number;
  replyCount: number;
  replies?: Comment[];
}

interface CommentResponse {
  success: boolean;
  comments: Comment[];
  total: number;
  enabled: boolean;
  message?: string;
}

async function getComments(request: NextRequest): Promise<NextResponse<CommentResponse>> {
  const url = request.nextUrl.searchParams.get('url');
  const commentId = request.nextUrl.searchParams.get('comment_id');
  const biz = request.nextUrl.searchParams.get('biz');

  const config = getWxdownConfig();

  if (!config.enabled) {
    return NextResponse.json({
      success: false,
      comments: [],
      total: 0,
      enabled: false,
      message: 'wxdown-service 未启用。请先启动 wxdown-service 并在设置中配置连接。',
    });
  }

  let credentialParams: { __biz: string; uin: string; key: string; pass_ticket: string } | null = null;
  let cookieHeader = '';

  if (biz) {
    const credential = getCredentials(biz);
    if (credential) {
      const cookies = parseSetCookieHeader(credential.set_cookie);
      cookieHeader = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      
      const params = extractCredentialParams(credential.url);
      if (params) {
        credentialParams = params;
      }
    }
  }

  if (url && !credentialParams) {
    credentialParams = extractCredentialParams(url);
  }

  if (!commentId && !credentialParams?.__biz) {
    return NextResponse.json({
      success: false,
      comments: [],
      total: 0,
      enabled: true,
      message: '缺少必要参数：comment_id 或 url/biz',
    });
  }

  try {
    const params = new URLSearchParams({
      action: 'getcomment',
      __biz: credentialParams?.__biz || '',
      comment_id: commentId || '',
      uin: credentialParams?.uin || '',
      key: credentialParams?.key || '',
      pass_ticket: credentialParams?.pass_ticket || '',
      limit: '100',
      f: 'json',
    });

    const response = await fetch(
      `https://mp.weixin.qq.com/mp/appmsg_comment?${params.toString()}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': 'https://mp.weixin.qq.com/',
          'Cookie': cookieHeader,
        },
      }
    );

    const data = await response.json();

    if (data.base_resp && data.base_resp.ret === 0) {
      const comments: Comment[] = (data.elected_comment || []).map((item: {
        content_id?: string;
        content: string;
        nick_name: string;
        logo_url: string;
        create_time: number;
        like_count: number;
        reply_count: number;
        reply?: Array<{
          content: string;
          nick_name: string;
          logo_url: string;
          create_time: number;
        }>;
      }) => ({
        id: item.content_id || Math.random().toString(36),
        content: item.content,
        author: item.nick_name,
        avatar: item.logo_url,
        createTime: item.create_time,
        likeCount: item.like_count,
        replyCount: item.reply_count,
        replies: item.reply?.map((reply) => ({
          id: Math.random().toString(36),
          content: reply.content,
          author: reply.nick_name,
          avatar: reply.logo_url,
          createTime: reply.create_time,
          likeCount: 0,
          replyCount: 0,
        })),
      }));

      return NextResponse.json({
        success: true,
        comments,
        total: comments.length,
        enabled: true,
      });
    }

    return NextResponse.json({
      success: false,
      comments: [],
      total: 0,
      enabled: true,
      message: data.base_resp?.err_msg || '获取评论失败',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      comments: [],
      total: 0,
      enabled: true,
      message: error instanceof Error ? error.message : '获取评论失败',
    });
  }
}
