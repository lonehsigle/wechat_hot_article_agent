import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatAuth, wechatSubscriptions, collectedArticles, collectTasks, materialLibrary } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    if (action === 'check-auth') {
      const auth = await db().select().from(wechatAuth).where(eq(wechatAuth.status, 'active')).limit(1);
      if (auth.length > 0 && auth[0].expiresAt && auth[0].expiresAt > new Date()) {
        return NextResponse.json({ authorized: true, auth: auth[0] });
      }
      return NextResponse.json({ authorized: false });
    }

    if (action === 'list-subscriptions') {
      const subscriptions = await db().select().from(wechatSubscriptions).orderBy(desc(wechatSubscriptions.createdAt));
      return NextResponse.json(subscriptions);
    }

    if (action === 'list-articles') {
      const subscriptionId = searchParams.get('subscriptionId');
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '20');
      
      if (subscriptionId) {
        const articles = await db().select().from(collectedArticles)
          .where(eq(collectedArticles.subscriptionId, parseInt(subscriptionId)))
          .orderBy(desc(collectedArticles.publishTime))
          .limit(pageSize)
          .offset((page - 1) * pageSize);
        return NextResponse.json(articles);
      }
      
      const articles = await db().select().from(collectedArticles)
        .orderBy(desc(collectedArticles.publishTime))
        .limit(pageSize)
        .offset((page - 1) * pageSize);
      return NextResponse.json(articles);
    }

    if (action === 'list-tasks') {
      const tasks = await db().select().from(collectTasks).orderBy(desc(collectTasks.createdAt));
      return NextResponse.json(tasks);
    }

    if (action === 'delete-article') {
      const articleId = searchParams.get('articleId');
      if (!articleId) {
        return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
      }
      await db().delete(collectedArticles).where(eq(collectedArticles.id, parseInt(articleId)));
      return NextResponse.json({ success: true, message: '文章已删除' });
    }

  if (action === 'clear-lock') {
    const { releaseLock, cleanQRCode } = await import('@/lib/wechat-auth');
    releaseLock();
    cleanQRCode();
    return NextResponse.json({ success: true, message: '锁已清理' });
  }

  if (action === 'start-qrcode-auth') {
    const { WechatAuthController, setAuthController, getAuthController, cleanQRCode, checkLock, setLock, releaseLock } = await import('@/lib/wechat-auth');
    
    // 先清理旧的锁和二维码文件
    releaseLock();
    cleanQRCode();
    
    // 等待一小段时间确保文件系统操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 再次检查是否还有其他进程在运行
    if (checkLock()) {
      return NextResponse.json({ 
        error: '授权流程正在运行，请勿重复运行' 
      }, { status: 400 });
    }
    
    setLock();
    
    const token = randomBytes(32).toString('hex');
    await db().insert(wechatAuth).values({
      token,
      status: 'pending',
    });
    
    const controller = new WechatAuthController();
    setAuthController(controller);
    
    try {
      await controller.startBrowser();
      const qrcodeUrl = await controller.generateQRCode();
      
      const authPromise = (async () => {
        try {
          const loginSuccess = await controller.waitForLogin(60000);
          
          if (loginSuccess) {
            const session = await controller.extractSession();
            if (session) {
              await db().update(wechatAuth)
                .set({ 
                  status: 'active',
                  cookie: session.cookiesStr,
                  token: session.token,
                  expiresAt: session.expiry?.expiryTime ? new Date(session.expiry.expiryTime) : null,
                })
                .where(eq(wechatAuth.token, token));
              
              return { success: true, session };
            }
          }
          
          return { success: false, error: '授权超时或失败' };
        } catch (error) {
          console.error('授权流程错误:', error);
          return { success: false, error: String(error) };
        } finally {
          releaseLock();
          await controller.close();
        }
      })();
      
      return NextResponse.json({ 
        success: true, 
        token,
        qrcodeUrl: '/wx_qrcode.png',
        expiresIn: 120,
      });
    } catch (error) {
      releaseLock();
      await controller.close();
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : '生成二维码失败' 
      }, { status: 500 });
    }
  }

  if (action === 'get-qrcode') {
    const token = randomBytes(32).toString('hex');
    const [auth] = await db().insert(wechatAuth).values({
      token,
      status: 'pending',
    }).returning();
    
    return NextResponse.json({ 
      success: true, 
      token,
      qrcodeUrl: `/api/wechat-collect/auth?token=${token}`,
      expiresIn: 120,
    });
  }

  if (action === 'check-scan-status') {
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }
    
    const [auth] = await db().select().from(wechatAuth).where(eq(wechatAuth.token, token)).limit(1);
    if (!auth) {
      return NextResponse.json({ status: 'expired', message: '二维码已过期' });
    }
    
    if (auth.status === 'active') {
      return NextResponse.json({ status: 'success', message: '授权成功' });
    }
    
    if (auth.status === 'pending') {
      return NextResponse.json({ status: 'waiting', message: '等待扫码' });
    }
    
    return NextResponse.json({ status: 'expired', message: '二维码已过期' });
  }

  if (action === 'get-account-info') {
    const cookie = searchParams.get('cookie');
    if (!cookie) {
      return NextResponse.json({ error: 'cookie is required' }, { status: 400 });
    }
    
    try {
      const res = await fetch('https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token=', {
        headers: {
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      
      const text = await res.text();
      const nicknameMatch = text.match(/nickname\s*:\s*['"]([^'"]+)['"]/);
      const headImgMatch = text.match(/head_img\s*:\s*['"]([^'"]+)['"]/);
      
      if (nicknameMatch) {
        return NextResponse.json({
          success: true,
          nickname: nicknameMatch[1],
          avatar: headImgMatch ? headImgMatch[1] : null,
        });
      }
      
      return NextResponse.json({ error: '无法获取账号信息，请检查Cookie是否正确' }, { status: 400 });
    } catch (error) {
      return NextResponse.json({ error: '获取账号信息失败' }, { status: 500 });
    }
  }

  if (action === 'get-article-info') {
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }
    
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      
      const text = await res.text();
      
      const bizMatch = text.match(/var\s+biz\s*=\s*['"]([^'"]+)['"]/);
      const nicknameMatch = text.match(/var\s+nickname\s*=\s*['"]([^'"]+)['"]/);
      const titleMatch = text.match(/var\s+msg_title\s*=\s*['"]([^'"]+)['"]/);
      const descMatch = text.match(/var\s+msg_desc\s*=\s*['"]([^'"]+)['"]/);
      const coverMatch = text.match(/var\s+msg_link\s*=\s*['"]([^'"]+)['"]/);
      
      if (bizMatch && nicknameMatch) {
        return NextResponse.json({
          success: true,
          biz: bizMatch[1],
          nickname: nicknameMatch[1],
          articleTitle: titleMatch ? decodeURIComponent(titleMatch[1].replace(/\\x/g, '%')) : null,
          articleDesc: descMatch ? decodeURIComponent(descMatch[1].replace(/\\x/g, '%')) : null,
        });
      }
      
      return NextResponse.json({ error: '无法解析文章链接，请确认是有效的微信公众号文章链接' }, { status: 400 });
    } catch (error) {
      return NextResponse.json({ error: '解析文章链接失败' }, { status: 500 });
    }
  }

  if (action === 'search-biz') {
    const query = searchParams.get('query');
    const cookie = searchParams.get('cookie');
    
    if (!query || !cookie) {
      return NextResponse.json({ error: 'query and cookie are required' }, { status: 400 });
    }
    
    try {
      const results = await searchBiz(cookie, query);
      return NextResponse.json({ success: true, results });
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : '搜索公众号失败' 
      }, { status: 500 });
    }
  }

  if (action === 'collect-article-by-url') {
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }
    
    try {
      const article = await collectArticleByUrl(url);
      return NextResponse.json({ success: true, article });
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : '采集文章失败' 
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '服务器内部错误' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === 'init-auth') {
    const token = randomBytes(32).toString('hex');
    const [auth] = await db().insert(wechatAuth).values({
      token,
      status: 'pending',
    }).returning();
    
    return NextResponse.json({ 
      success: true, 
      token,
      authUrl: `/api/wechat-collect/auth?token=${token}`,
    });
  }

  if (action === 'complete-auth') {
    const { token, cookie, nickname, avatar } = body;
    
    const [auth] = await db().update(wechatAuth)
      .set({
        cookie,
        nickname,
        avatar,
        status: 'active',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(wechatAuth.token, token))
      .returning();
    
    return NextResponse.json({ success: true, auth });
  }

  if (action === 'add-subscription') {
    const { biz, name, alias, avatar, description } = body;
    
    const existing = await db().select().from(wechatSubscriptions).where(eq(wechatSubscriptions.biz, biz)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: '该公众号已添加' }, { status: 400 });
    }
    
    const [subscription] = await db().insert(wechatSubscriptions).values({
      biz,
      name,
      alias,
      avatar,
      description,
    }).returning();
    
    return NextResponse.json({ success: true, subscription });
  }

  if (action === 'update-subscription') {
    const { id, monitorEnabled, monitorInterval, alias } = body;
    
    const [subscription] = await db().update(wechatSubscriptions)
      .set({
        monitorEnabled,
        monitorInterval,
        alias,
        updatedAt: new Date(),
      })
      .where(eq(wechatSubscriptions.id, id))
      .returning();
    
    return NextResponse.json({ success: true, subscription });
  }

  if (action === 'delete-subscription') {
    const { id } = body;
    
    await db().delete(wechatSubscriptions).where(eq(wechatSubscriptions.id, id));
    
    return NextResponse.json({ success: true });
  }

  if (action === 'start-collect') {
    const { subscriptionId, type, count } = body;
    
    const [subscription] = await db().select().from(wechatSubscriptions).where(eq(wechatSubscriptions.id, subscriptionId));
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    const [auth] = await db().select().from(wechatAuth).where(eq(wechatAuth.status, 'active')).limit(1);
    if (!auth || !auth.cookie) {
      return NextResponse.json({ error: '请先完成微信授权' }, { status: 400 });
    }
    
    const [task] = await db().insert(collectTasks).values({
      subscriptionId,
      type: type || 'incremental',
      totalArticles: count || 5,
      status: 'pending',
    }).returning();
    
    try {
      const articles = await fetchWechatArticles(auth.cookie, subscription.biz, count || 5);
      
      let collected = 0;
      for (const article of articles) {
        const existing = await db().select().from(collectedArticles)
          .where(eq(collectedArticles.msgId, article.msgId))
          .limit(1);
        
        if (existing.length === 0) {
          await db().insert(collectedArticles).values({
            subscriptionId: subscription.id,
            msgId: article.msgId,
            title: article.title,
            author: article.author,
            digest: article.digest,
            content: article.content,
            contentHtml: article.contentHtml,
            coverImage: article.coverImage,
            sourceUrl: article.sourceUrl,
            publishTime: article.publishTime ? new Date(article.publishTime * 1000) : null,
            readCount: article.readCount,
            likeCount: article.likeCount,
          });
          collected++;
        }
      }
      
      await db().update(collectTasks)
        .set({ 
          status: 'completed', 
          collectedArticles: collected,
          completedAt: new Date() 
        })
        .where(eq(collectTasks.id, task.id));
      
      await db().update(wechatSubscriptions)
        .set({
          totalArticles: (subscription.totalArticles || 0) + collected,
          lastArticleTime: new Date(),
          lastMonitorAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(wechatSubscriptions.id, subscription.id));
      
      return NextResponse.json({ success: true, collected, task: { ...task, status: 'completed' } });
    } catch (error) {
      console.error('Collect error:', error);
      
      await db().update(collectTasks)
        .set({ 
          status: 'failed', 
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date() 
        })
        .where(eq(collectTasks.id, task.id));
      
      return NextResponse.json({ error: error instanceof Error ? error.message : '采集失败' }, { status: 500 });
    }
  }

  if (action === 'save-article') {
    const { subscriptionId, msgId, title, author, digest, content, contentHtml, coverImage, sourceUrl, publishTime, readCount, likeCount } = body;
    
    const [article] = await db().insert(collectedArticles).values({
      subscriptionId,
      msgId,
      title,
      author,
      digest,
      content,
      contentHtml,
      coverImage,
      sourceUrl,
      publishTime: publishTime ? new Date(publishTime) : undefined,
      readCount,
      likeCount,
    }).returning();
    
    return NextResponse.json({ success: true, article });
  }

  if (action === 'update-article') {
    const { articleId, id, content, contentHtml, tags, note, isFavorite, readCount, likeCount, commentCount, recommendCount, shareCount, publishTime } = body;
    
    const targetId = articleId || id;
    if (!targetId) {
      return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
    }
    
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (content !== undefined) updateData.content = content;
    if (contentHtml !== undefined) updateData.contentHtml = contentHtml;
    if (tags !== undefined) updateData.tags = tags;
    if (note !== undefined) updateData.note = note;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (readCount !== undefined) updateData.readCount = readCount;
    if (likeCount !== undefined) updateData.likeCount = likeCount;
    if (commentCount !== undefined) updateData.commentCount = commentCount;
    if (recommendCount !== undefined) updateData.recommendCount = recommendCount;
    if (shareCount !== undefined) updateData.shareCount = shareCount;
    if (publishTime !== undefined) updateData.publishTime = publishTime ? new Date(publishTime) : null;
    
    if (readCount !== undefined && readCount > 0) {
      const r = readCount;
      const l = likeCount ?? 0;
      const c = commentCount ?? 0;
      const rc = recommendCount ?? 0;
      const sc = shareCount ?? 0;
      updateData.engagementRate = Number(((c + sc + l + rc) / r * 100).toFixed(2));
    }
    
    const [updatedArticle] = await db().update(collectedArticles)
      .set(updateData)
      .where(eq(collectedArticles.id, targetId))
      .returning();
    
    return NextResponse.json({ success: true, article: updatedArticle });
  }

  if (action === 'delete-article') {
    const { id } = body;
    
    await db().delete(collectedArticles).where(eq(collectedArticles.id, id));
    
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function fetchWechatArticles(cookie: string, biz: string, count: number) {
  const articles: Array<{
    msgId: string;
    title: string;
    author: string | null;
    digest: string | null;
    content: string | null;
    contentHtml: string | null;
    coverImage: string | null;
    sourceUrl: string;
    publishTime: number | null;
    readCount: number;
    likeCount: number;
  }> = [];
  
  try {
    const tokenMatch = cookie.match(/token=(\d+)/);
    const token = tokenMatch ? tokenMatch[1] : '';
    
    const params = new URLSearchParams({
      sub: 'list',
      sub_action: 'list_ex',
      begin: '0',
      count: String(count),
      fakeid: biz,
      token: token,
      lang: 'zh_CN',
      f: 'json',
      ajax: '1',
    });
    
    const url = `https://mp.weixin.qq.com/cgi-bin/appmsgpublish?${params.toString()}`;
    
    const res = await fetch(url, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://mp.weixin.qq.com/',
      },
    });
    
    const data = await res.json();
    
    if (data.base_resp?.ret !== 0) {
      throw new Error(data.base_resp?.err_msg || '获取文章列表失败');
    }
    
    let publishPage = data.publish_page;
    if (typeof publishPage === 'string') {
      publishPage = JSON.parse(publishPage);
    }
    
    const publishList = publishPage?.publish_list || [];
    
    for (const item of publishList) {
      try {
        let publishInfo = item.publish_info;
        if (typeof publishInfo === 'string') {
          publishInfo = JSON.parse(publishInfo);
        }
        
        const appmsgex = publishInfo?.appmsgex;
        if (!appmsgex || !Array.isArray(appmsgex) || appmsgex.length === 0) {
          continue;
        }
        
        const article = appmsgex[0];
        
        articles.push({
          msgId: article.app_id || article.appmsgid || `msg_${Date.now()}_${Math.random()}`,
          title: article.title || '',
          author: article.author || null,
          digest: article.digest || null,
          content: null,
          contentHtml: null,
          coverImage: article.cover || '',
          sourceUrl: article.link || '',
          publishTime: article.update_time || article.create_time || null,
          readCount: article.read_num || 0,
          likeCount: article.like_num || 0,
        });
      } catch (parseError) {
        console.error('Failed to parse publish_info:', parseError);
      }
    }
    
    return articles;
  } catch (error) {
    console.error('Failed to fetch wechat articles:', error);
    throw error;
  }
}

async function searchBiz(cookie: string, query: string, begin: number = 0, count: number = 10) {
  const tokenMatch = cookie.match(/token=(\d+)/);
  const token = tokenMatch ? tokenMatch[1] : '';
  
  const params = new URLSearchParams({
    action: 'search_biz',
    begin: String(begin),
    count: String(count),
    query: query,
    token: token,
    lang: 'zh_CN',
    f: 'json',
    ajax: '1',
  });
  
  const url = `https://mp.weixin.qq.com/cgi-bin/searchbiz?${params.toString()}`;
  
  const res = await fetch(url, {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://mp.weixin.qq.com/',
    },
  });
  
  const data = await res.json();
  
  if (data.base_resp?.ret !== 0) {
    throw new Error(data.base_resp?.err_msg || '搜索公众号失败');
  }
  
  let publishPage = data.publish_page;
  if (typeof publishPage === 'string') {
    publishPage = JSON.parse(publishPage);
  }
  
  const results = publishPage?.search_result?.result || [];
  
  return results.map((item: { fakeid?: string; nickname?: string; alias?: string; round_head_img?: string; signature?: string }) => ({
    biz: item.fakeid || '',
    name: item.nickname || '',
    alias: item.alias || '',
    avatar: item.round_head_img || '',
    description: item.signature || '',
  }));
}

async function collectArticleByUrl(articleUrl: string) {
  const [auth] = await db().select().from(wechatAuth).where(eq(wechatAuth.status, 'active')).limit(1);
  if (!auth || !auth.cookie) {
    throw new Error('请先完成微信授权');
  }

  const res = await fetch(articleUrl, {
    headers: {
      'Cookie': auth.cookie,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (res.status !== 200) {
    throw new Error(`请求失败，状态码: ${res.status}`);
  }
  
  const html = await res.text();

  // 检查是否是真正的错误页面（通过检查关键元素）
  const hasErrorPage = html.includes('class="error_page"') || 
                       html.includes('class="weui-msg"') ||
                       (html.includes('该内容已被发布者删除') && html.includes('weui-msg__title'));
  
  if (hasErrorPage) {
    throw new Error('文章不存在或已被删除');
  }
  
  // 检查是否需要验证码（通过检查验证码相关元素）
  const needVerify = (html.includes('环境验证') && html.includes('验证码')) ||
                     html.includes('class="weui-vcode-popup"');
  
  if (needVerify) {
    throw new Error('需要验证码，请重新扫码授权');
  }
  
  // 尝试多种正则表达式匹配
  let biz = '';
  let nickname = '';
  
  // 方式1: var biz = "xxx"
  const bizMatch1 = html.match(/var\s+biz\s*=\s*["']([^"']+)["']/);
  // 方式2: window.biz = "xxx"
  const bizMatch2 = html.match(/window\.biz\s*=\s*["']([^"']+)["']/);
  // 方式3: data-biz="xxx"
  const bizMatch3 = html.match(/data-biz\s*=\s*["']([^"']+)["']/);
  
  biz = bizMatch1?.[1] || bizMatch2?.[1] || bizMatch3?.[1] || '';
  
  // 方式1: var nickname = "xxx"
  const nicknameMatch1 = html.match(/var\s+nickname\s*=\s*["']([^"']+)["']/);
  // 方式2: window.nickname = "xxx"
  const nicknameMatch2 = html.match(/window\.nickname\s*=\s*["']([^"']+)["']/);
  // 方式3: data-nickname="xxx"
  const nicknameMatch3 = html.match(/data-nickname\s*=\s*["']([^"']+)["']/);
  // 方式4: 从meta标签获取
  const nicknameMatch4 = html.match(/<meta\s+property="og:nickname"\s+content="([^"]+)"/);
  
  nickname = nicknameMatch1?.[1] || nicknameMatch2?.[1] || nicknameMatch3?.[1] || nicknameMatch4?.[1] || '';

  if (!biz) {
    // 尝试从URL提取biz
    const bizFromUrl = articleUrl.match(/__biz=([^&]+)/);
    if (bizFromUrl) {
      biz = decodeURIComponent(bizFromUrl[1]);
    }
  }
  
  // 获取标题
  let title = '';
  const titleMatch1 = html.match(/var\s+msg_title\s*=\s*["']([^"']+)["']/);
  const titleMatch2 = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  const titleMatch3 = html.match(/<h1[^>]*class="rich_media_title"[^>]*>([^<]+)<\/h1>/);
  const titleMatch4 = html.match(/<title>([^<]+)<\/title>/);
  
  title = titleMatch1?.[1] || titleMatch2?.[1] || titleMatch3?.[1] || titleMatch4?.[1] || '';
  title = title.replace(/\\x/g, '%').replace(/&nbsp;/g, ' ').trim();
  try {
    title = decodeURIComponent(title);
  } catch {
    // 忽略解码错误
  }
  
  // 获取描述
  let description = '';
  const descMatch1 = html.match(/var\s+msg_desc\s*=\s*["']([^"']+)["']/);
  const descMatch2 = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
  description = descMatch1?.[1] || descMatch2?.[1] || '';
  description = description.replace(/\\x/g, '%').replace(/&nbsp;/g, ' ').trim();
  try {
    description = decodeURIComponent(description);
  } catch {
    // 忽略解码错误
  }
  
  // 获取封面图
  let cover = '';
  const coverMatch1 = html.match(/var\s+msg_link\s*=\s*["']([^"']+)["']/);
  const coverMatch2 = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  cover = coverMatch1?.[1] || coverMatch2?.[1] || '';
  
  // 获取发布时间
  // 微信的ct是UTC时间戳（秒），需要转换为北京时间（UTC+8）
  let createTime: number | null = null;
  const timeMatch1 = html.match(/var\s+ct\s*=\s*["']?(\d+)["']?/);
  const timeMatch2 = html.match(/data-publish-time\s*=\s*["']?(\d+)["']?/);
  const rawTime = timeMatch1 ? parseInt(timeMatch1[1]) : (timeMatch2 ? parseInt(timeMatch2[1]) : null);
  
  // 微信时间戳是UTC时间，需要加8小时转换为北京时间
  if (rawTime) {
    createTime = rawTime + 8 * 3600; // 加8小时
  }
  
  // 获取文章ID
  let msgId = `url_${Date.now()}`;
  const msgIdMatch = html.match(/var\s+msg_link\s*=\s*["'][^"']*\/s\/([^"']+)["']/);
  if (msgIdMatch) {
    msgId = msgIdMatch[1];
  } else {
    const urlMatch = articleUrl.match(/\/s\/([^?]+)/);
    if (urlMatch) {
      msgId = urlMatch[1];
    }
  }
  
  // 提取文章内容
  let contentHtml = '';
  const jsContentMatch = html.match(/<div\s+id="js_content"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>)?\s*(?:<\/div>)?\s*(?:<\/div>)?/);
  if (jsContentMatch) {
    contentHtml = jsContentMatch[1];
    contentHtml = contentHtml
      .replace(/data-src/g, 'src')
      .replace(/visibility:\s*hidden;?/gi, '')
      .replace(/width:\s*\d+px/gi, 'width: 100%');
  } else {
    // 尝试另一种方式提取内容
    const contentMatch = html.match(/<div\s+class="rich_media_content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>)?\s*(?:<\/div>)?/);
    if (contentMatch) {
      contentHtml = contentMatch[1];
    }
  }

  if (!biz && !title) {
    throw new Error('无法解析文章链接，请确认是有效的微信公众号文章链接');
  }
  
  // 如果没有nickname，使用默认值
  if (!nickname) {
    nickname = '未知公众号';
  }
  
  let subscriptionId: number | null = null;
  
  if (biz) {
    const [existingSub] = await db().select().from(wechatSubscriptions).where(eq(wechatSubscriptions.biz, biz)).limit(1);
    
    if (existingSub) {
      subscriptionId = existingSub.id;
    } else {
      const [newSub] = await db().insert(wechatSubscriptions).values({
        biz,
        name: nickname,
        alias: nickname,
        avatar: '',
        description: '',
      }).returning();
      subscriptionId = newSub.id;
    }
  }
  
  const plainContent = contentHtml.replace(/<[^>]*>/g, '').trim();
  
  const [article] = await db().insert(collectedArticles).values({
    subscriptionId,
    msgId,
    title: title || '无标题',
    author: nickname,
    digest: description || plainContent.substring(0, 200),
    content: plainContent,
    contentHtml,
    coverImage: cover,
    sourceUrl: articleUrl,
    publishTime: createTime ? new Date(createTime * 1000) : null,
    readCount: 0,
    likeCount: 0,
  }).returning();
  
  await db().insert(materialLibrary).values({
    type: 'wechat_article',
    source: nickname || '微信公众号',
    sourceUrl: articleUrl,
    title: title || '无标题',
    content: plainContent,
    keyPoints: [],
    quotes: [],
    dataPoints: [],
    tags: [nickname, '微信采集'].filter(Boolean),
    topicId: null,
    isUsed: false,
  });

  return article;
}
