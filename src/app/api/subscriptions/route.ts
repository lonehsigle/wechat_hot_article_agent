import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatSubscriptions, wechatSessions, collectedArticles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { USER_AGENT } from '@/lib/wechat/proxy-request';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'list':
        return await listSubscriptions(request);
      case 'delete':
        return await deleteSubscription(request);
      case 'fetch':
        return await fetchNewArticles(request);
      case 'run':
        return await runMonitor(request);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Subscription API error:', error);
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
      case 'add':
        return await addSubscription(request);
      case 'update':
        return await updateSubscription(request);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function listSubscriptions(request: NextRequest) {
  const subscriptions = await db()
    .select()
    .from(wechatSubscriptions)
    .orderBy(wechatSubscriptions.createdAt);

  return NextResponse.json({
    success: true,
    subscriptions: subscriptions.map(s => ({
      id: s.id,
      biz: s.biz,
      name: s.name,
      alias: s.alias,
      avatar: s.avatar,
      description: s.description,
      lastArticleTime: s.lastArticleTime,
      totalArticles: s.totalArticles,
      monitorEnabled: s.monitorEnabled,
      monitorInterval: s.monitorInterval,
      lastMonitorAt: s.lastMonitorAt,
      status: s.status,
    })),
  });
}

async function addSubscription(request: NextRequest) {
  const body = await request.json();
  const { biz, name, alias, avatar, description, monitorEnabled, monitorInterval } = body;

  if (!biz || !name) {
    return NextResponse.json({ 
      success: false, 
      error: 'biz and name are required' 
    }, { status: 400 });
  }

  try {
    const existing = await db()
      .select()
      .from(wechatSubscriptions)
      .where(eq(wechatSubscriptions.biz, biz))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subscription already exists' 
      }, { status: 400 });
    }

    await db()
      .insert(wechatSubscriptions)
      .values({
        biz,
        name,
        alias: alias || null,
        avatar: avatar || null,
        description: description || null,
        monitorEnabled: monitorEnabled ?? true,
        monitorInterval: monitorInterval || 300,
        status: 'active',
      });

    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function updateSubscription(request: NextRequest) {
  const body = await request.json();
  const { id, monitorEnabled, monitorInterval } = body;

  if (!id) {
    return NextResponse.json({ 
      success: false, 
      error: 'id is required' 
    }, { status: 400 });
  }

  try {
    await db()
      .update(wechatSubscriptions)
      .set({
        monitorEnabled,
        monitorInterval,
        updatedAt: new Date(),
      })
      .where(eq(wechatSubscriptions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function deleteSubscription(request: NextRequest) {
  const idStr = request.nextUrl.searchParams.get('id');

  if (!idStr) {
    return NextResponse.json({ 
      success: false, 
      error: 'id is required' 
    }, { status: 400 });
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ 
      success: false, 
      error: 'id must be a number' 
    }, { status: 400 });
  }

  try {
    await db()
      .delete(wechatSubscriptions)
      .where(eq(wechatSubscriptions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function fetchNewArticles(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('auth_key');
  const biz = request.nextUrl.searchParams.get('biz');
  const count = parseInt(request.nextUrl.searchParams.get('count') || '5');

  const begin = parseInt(request.nextUrl.searchParams.get('begin') || '0');

  if (!authKey || !biz) {
    return NextResponse.json({ 
      success: false, 
      error: 'auth_key and biz are required' 
    }, { status: 400 });
  }

  const sessions = await db()
    .select()
    .from(wechatSessions)
    .where(eq(wechatSessions.authKey, authKey))
    .limit(1);

  if (sessions.length === 0) {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid auth_key' 
    }, { status: 401 });
  }

  const session = sessions[0];
  const subscriptions = await db()
    .select()
    .from(wechatSubscriptions)
    .where(eq(wechatSubscriptions.biz, biz))
    .limit(1);

  if (subscriptions.length === 0) {
    return NextResponse.json({ 
      success: false, 
      error: 'Subscription not found' 
    }, { status: 404 });
  }

  const subscription = subscriptions[0];

  try {
    const params = new URLSearchParams({
      sub: 'list',
      search_field: 'null',
      begin: begin.toString(),
      count: count.toString(),
      query: '',
      fakeid: biz,
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

    if (data.base_resp && data.base_resp.ret === 0) {
      const publishPage = JSON.parse(data.publish_page);
      const articles = publishPage.publish_list
        .filter((item: { publish_info: string }) => !!item.publish_info)
        .flatMap((item: { publish_info: string }) => {
          const publishInfo = JSON.parse(item.publish_info);
          return publishInfo.appmsgex;
        });

      const lastArticleTime = articles.length > 0 
        ? new Date(articles[0].create_time * 1000) 
        : subscription.lastArticleTime;

      await db()
        .update(wechatSubscriptions)
        .set({
        lastArticleTime,
        totalArticles: (subscription.totalArticles || 0) + articles.length,
        lastMonitorAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wechatSubscriptions.id, subscription.id));

      return NextResponse.json({
        success: true,
        articles,
        total: publishPage.total_count || articles.length,
      });
    }

    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function runMonitor(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('auth_key');
  
  if (!authKey) {
    return NextResponse.json({ 
      success: false, 
      error: 'auth_key is required' 
    }, { status: 400 });
  }

  const sessions = await db()
    .select()
    .from(wechatSessions)
    .where(eq(wechatSessions.authKey, authKey))
    .limit(1);

  if (sessions.length === 0) {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid auth_key' 
    }, { status: 401 });
  }

  const session = sessions[0];
  const subscriptions = await db()
    .select()
    .from(wechatSubscriptions)
    .where(eq(wechatSubscriptions.monitorEnabled, true));

  
  const results = [];
  
  for (const subscription of subscriptions) {
    const now = Date.now();
    const lastMonitor = subscription.lastMonitorAt 
      ? (typeof subscription.lastMonitorAt === 'number' 
          ? subscription.lastMonitorAt 
          : new Date(subscription.lastMonitorAt).getTime())
      : 0;
    const interval = (subscription.monitorInterval || 300) * 1000;
    
    if (now - lastMonitor < interval) {
      continue;
    }
    
    try {
      const params = new URLSearchParams({
        sub: 'list',
        search_field: 'null',
        begin: '0',
        count: '5',
        query: '',
        fakeid: subscription.biz,
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
      
      if (data.base_resp && data.base_resp.ret === 0) {
        const publishPage = JSON.parse(data.publish_page);
        const articles = publishPage.publish_list
          .filter((item: { publish_info: string }) => !!item.publish_info)
          .flatMap((item: { publish_info: string }) => {
            const publishInfo = JSON.parse(item.publish_info);
            return publishInfo.appmsgex;
          });
        
        results.push({
          subscription: subscription.name,
          newArticles: articles.length,
          success: true,
        });
        
        await db()
          .update(wechatSubscriptions)
          .set({
            lastMonitorAt: new Date(),
            totalArticles: (subscription.totalArticles || 0) + articles.length,
            updatedAt: new Date(),
          })
          .where(eq(wechatSubscriptions.id, subscription.id));
      } else {
        results.push({
          subscription: subscription.name,
          success: false,
          error: data.base_resp?.err_msg || 'Unknown error',
        });
      }
    } catch (error) {
      results.push({
        subscription: subscription.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return NextResponse.json({
    success: true,
    results,
    monitoredAt: new Date().toISOString(),
  });
}
