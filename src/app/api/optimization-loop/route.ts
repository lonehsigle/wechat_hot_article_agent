import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { publishedArticles, optimizationSuggestions, contents, wechatAuth, wechatAccounts } from '@/lib/db/schema';
import { eq, desc, and, isNotNull, sql } from 'drizzle-orm';
import { callLLM } from '@/lib/llm/service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'list':
        return await handleListArticles();
      case 'suggestions':
        return await handleListSuggestions(searchParams);
      case 'stats':
        return await handleGetStats();
      case 'fetch-published':
        return await handleFetchPublishedArticles(searchParams);
      case 'source-contents':
        return await handleGetSourceContents(searchParams);
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[闭环优化] API 错误:', error);
    return NextResponse.json({ 
      success: false, error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const { action } = body;

  try {
    switch (action) {
      case 'add':
        return await handleAddPublishedArticle(body as any);
      case 'update-stats':
        return await handleUpdateStats(body as any);
      case 'analyze':
        return await handleAnalyzeGap(body as any);
      case 'review-suggestion':
        return await handleReviewSuggestion(body as any);
      case 'collect-published':
        return await handleCollectPublishedArticles(body as any);
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[闭环优化] API 错误:', error);
    return NextResponse.json({ 
      success: false, error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function handleListArticles() {
  const articles = await db()
    .select()
    .from(publishedArticles)
    .where(isNotNull(publishedArticles.sourceContentId))
    .orderBy(desc(publishedArticles.createdAt));

  return NextResponse.json({ articles });
}

async function handleListSuggestions(searchParams: URLSearchParams) {
  const status = searchParams.get('status') || 'all';
  const priority = searchParams.get('priority') || 'all';

  let query = db()
    .select()
    .from(optimizationSuggestions);

  const conditions = [];
  if (status !== 'all') {
    conditions.push(eq(optimizationSuggestions.status, status));
  }
  if (priority !== 'all') {
    conditions.push(eq(optimizationSuggestions.priority, priority));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const suggestions = await query.orderBy(desc(optimizationSuggestions.createdAt));

  return NextResponse.json({ suggestions });
}

async function handleGetStats() {
  const totalArticles = await db()
    .select({ count: sql<number>`count(*)` })
    .from(publishedArticles)
    .where(isNotNull(publishedArticles.sourceContentId));

  const analyzedArticles = await db()
    .select({ count: sql<number>`count(*)` })
    .from(publishedArticles)
    .where(and(
      isNotNull(publishedArticles.sourceContentId),
      eq(publishedArticles.analysisStatus, 'completed')
    ));

  const pendingSuggestions = await db()
    .select({ count: sql<number>`count(*)` })
    .from(optimizationSuggestions)
    .where(eq(optimizationSuggestions.status, 'pending'));

  const avgPerformance = await db()
    .select({ avg: sql<number>`avg(performance_ratio)` })
    .from(optimizationSuggestions);

  return NextResponse.json({
    totalArticles: totalArticles[0]?.count || 0,
    analyzedArticles: analyzedArticles[0]?.count || 0,
    pendingSuggestions: pendingSuggestions[0]?.count || 0,
    avgPerformanceRatio: Math.round((avgPerformance[0]?.avg || 0) * 100) / 100,
  });
}

async function handleAddPublishedArticle(data: {
  title: string;
  content?: string;
  articleUrl?: string;
  publishTime?: string;
  sourceContentId?: number;
  readCount?: number;
  likeCount?: number;
  lookCount?: number;
  shareCount?: number;
  commentCount?: number;
}) {
  const now = new Date();

  let sourceTitle = '';
  let sourceReadCount = 0;
  let sourceLikeCount = 0;
  let sourceDigest = '';

  if (data.sourceContentId) {
    const sourceContent = await db()
      .select()
      .from(contents)
      .where(eq(contents.id, data.sourceContentId))
      .limit(1);

    if (sourceContent.length > 0) {
      sourceTitle = sourceContent[0].title;
      sourceReadCount = sourceContent[0].readCount || 0;
      sourceLikeCount = sourceContent[0].likes || 0;
      sourceDigest = sourceContent[0].digest || '';
    }
  }

  const result = await db()
    .insert(publishedArticles)
    .values({
      title: data.title,
      content: data.content || '',
      articleUrl: data.articleUrl || '',
      publishTime: data.publishTime ? new Date(data.publishTime) : now,
      sourceContentId: data.sourceContentId || null,
      sourceTitle,
      sourceReadCount,
      sourceLikeCount,
      sourceDigest,
      readCount: data.readCount || 0,
      likeCount: data.likeCount || 0,
      lookCount: data.lookCount || 0,
      shareCount: data.shareCount || 0,
      commentCount: data.commentCount || 0,
      publishStatus: 'published',
      analysisStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ 
    success: true, 
    article: result[0] 
  });
}

async function handleUpdateStats(data: {
  articleId: number;
  readCount?: number;
  likeCount?: number;
  lookCount?: number;
  shareCount?: number;
  commentCount?: number;
}) {
  const now = new Date();

  const updateData: Partial<typeof publishedArticles.$inferInsert> = { updatedAt: now };
  if (data.readCount !== undefined) updateData.readCount = data.readCount;
  if (data.likeCount !== undefined) updateData.likeCount = data.likeCount;
  if (data.lookCount !== undefined) updateData.lookCount = data.lookCount;
  if (data.shareCount !== undefined) updateData.shareCount = data.shareCount;
  if (data.commentCount !== undefined) updateData.commentCount = data.commentCount;

  await db()
    .update(publishedArticles)
    .set(updateData)
    .where(eq(publishedArticles.id, data.articleId));

  return NextResponse.json({ success: true });
}

async function handleAnalyzeGap(data: { articleId: number }) {
  const article = await db()
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.id, data.articleId))
    .limit(1);

  if (!article.length) {
    return NextResponse.json({ success: false, error: '文章不存在' }, { status: 404 });
  }

  const articleData = article[0];

  if (!articleData.sourceContentId) {
    return NextResponse.json({ success: false, error: '该文章未关联原文' }, { status: 400 });
  }

  const sourceContent = await db()
    .select()
    .from(contents)
    .where(eq(contents.id, articleData.sourceContentId))
    .limit(1);

  if (!sourceContent.length) {
    return NextResponse.json({ success: false, error: '原文不存在' }, { status: 404 });
  }

  const source = sourceContent[0];

  const accounts = await db()
    .select()
    .from(wechatAccounts)
    .limit(1);

  const accountInfo = accounts.length > 0 ? accounts[0] : null;

  await db()
    .update(publishedArticles)
    .set({ analysisStatus: 'analyzing' })
    .where(eq(publishedArticles.id, data.articleId));

  try {
    const readRatio = (source.readCount || 0) > 0 
      ? Math.round(((articleData.readCount || 0) / (source.readCount || 1)) * 100 * 100) / 100 
      : 0;
    const engagementRatio = ((source.likes || 0) + (source.readCount || 0)) > 0
      ? Math.round((((articleData.likeCount || 0) + (articleData.lookCount || 0)) / ((source.likes || 0) + (source.readCount || 0))) * 100 * 100) / 100
      : 0;

    const accountContext = accountInfo ? `
【公众号定位信息】
目标用户群体：${accountInfo.targetAudience || '未设置'}
读者画像：${accountInfo.readerPersona || '未设置'}
内容风格：${accountInfo.contentStyle || '未设置'}
主要话题领域：${accountInfo.mainTopics ? (accountInfo.mainTopics as string[]).join('、') : '未设置'}
语言风格偏好：${accountInfo.tonePreference || '未设置'}
` : '';

    const analysisPrompt = `你是一位资深的公众号运营专家，擅长分析文章表现差距。
${accountContext}
请对比分析以下原文和改写文章，找出改写文章表现不佳的原因，并结合公众号定位给出针对性建议。

【原文信息】
标题：${source.title}
阅读数：${source.readCount || 0}
点赞数：${source.likes}
内容摘要：${source.digest || source.title}

【改写文章信息】
标题：${articleData.title}
阅读数：${articleData.readCount}
点赞数：${articleData.likeCount}
在看数：${articleData.lookCount}
内容摘要：${articleData.content?.substring(0, 500) || ''}

【表现比率】
阅读比率：${readRatio}%
互动比率：${engagementRatio}%

请从以下维度分析差距，并给出具体优化建议：

1. **标题吸引力**
   - 原文标题的优点
   - 改写标题的问题
   - 结合目标用户群体的具体优化建议

2. **开头抓人程度**
   - 原文开头的优点（如有信息）
   - 改写开头的问题
   - 结合读者画像的具体优化建议

3. **内容价值**
   - 原文内容的优点
   - 改写内容的问题
   - 结合内容风格的具体优化建议

4. **结构节奏**
   - 分析改写文章的结构问题
   - 结合用户阅读习惯的具体优化建议

5. **结尾引导**
   - 分析改写文章的结尾问题
   - 结合互动目标的具体优化建议

6. **用户匹配度**（如有公众号定位信息）
   - 分析改写内容是否符合目标用户群体
   - 分析语言风格是否符合读者画像
   - 给出针对性调整建议

请返回 JSON 格式（不要包含 markdown 代码块标记）：
{
  "analysis": [
    {
      "gapType": "title|opening|content|structure|ending|audience",
      "sourceStrength": "原文的优点",
      "rewriteWeakness": "改写的问题",
      "suggestion": "具体优化建议",
      "priority": "high|medium|low"
    }
  ],
  "overallAssessment": "整体评估",
  "keyRecommendations": ["关键建议1", "关键建议2"],
  "audienceFit": {
    "score": 0-100,
    "issues": ["问题1", "问题2"],
    "suggestions": ["建议1", "建议2"]
  }
}`;

    const response = await callLLM([
      { role: 'user', content: analysisPrompt },
    ], { temperature: 0.7, maxTokens: 4096 });
    const analysisResult = response.content;

    let parsedResult;
    try {
      const cleanedResult = analysisResult.replace(/```json\n?|\n?```/g, '').trim();
      parsedResult = JSON.parse(cleanedResult);
    } catch {
      console.error('[闭环优化] JSON 解析失败，使用默认结构');
      parsedResult = {
        analysis: [{
          gapType: 'content',
          sourceStrength: '原文表现良好',
          rewriteWeakness: '改写文章表现不佳',
          suggestion: analysisResult,
          priority: 'medium',
        }],
        overallAssessment: analysisResult,
        keyRecommendations: [],
      };
    }

    const now = new Date();

    if (parsedResult.analysis && Array.isArray(parsedResult.analysis)) {
      for (const item of parsedResult.analysis) {
        await db()
          .insert(optimizationSuggestions)
          .values({
            articleId: data.articleId,
            gapType: item.gapType || 'content',
            gapDescription: item.rewriteWeakness || '',
            sourceStrength: item.sourceStrength || '',
            rewriteWeakness: item.rewriteWeakness || '',
            suggestion: item.suggestion || '',
            priority: item.priority || 'medium',
            performanceRatio: readRatio,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          });
      }
    }

    await db()
      .update(publishedArticles)
      .set({
        analysisStatus: 'completed',
        analysisResult: JSON.stringify(parsedResult),
        analyzedAt: now,
        updatedAt: now,
      })
      .where(eq(publishedArticles.id, data.articleId));

    return NextResponse.json({
      success: true,
      analysis: parsedResult,
      readRatio,
      engagementRatio,
    });
  } catch (error) {
    await db()
      .update(publishedArticles)
      .set({ analysisStatus: 'pending' })
      .where(eq(publishedArticles.id, data.articleId));

    throw error;
  }
}

async function handleReviewSuggestion(data: {
  suggestionId: number;
  reviewAction: 'approve' | 'reject' | 'modify';
  note?: string;
  modifiedSuggestion?: string;
}) {
  const now = new Date();
  const status = data.reviewAction === 'approve' ? 'approved' : 
                 data.reviewAction === 'reject' ? 'rejected' : 'approved';

  const updateData: Partial<typeof optimizationSuggestions.$inferInsert> = {
    status,
    reviewedAt: now,
    updatedAt: now,
  };

  if (data.note) {
    updateData.reviewerNote = data.note;
  }

  if (data.modifiedSuggestion) {
    updateData.suggestion = data.modifiedSuggestion;
  }

  await db()
    .update(optimizationSuggestions)
    .set(updateData)
    .where(eq(optimizationSuggestions.id, data.suggestionId));

  return NextResponse.json({ success: true });
}

async function handleGetSourceContents(searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get('limit') || '100') || 100;
  const offset = parseInt(searchParams.get('offset') || '0') || 0;

  const result = await db()
    .select({
      id: contents.id,
      title: contents.title,
      author: contents.author,
      readCount: contents.readCount,
      likeCount: contents.likes,
      digest: contents.digest,
      date: contents.date,
      url: contents.url,
    })
    .from(contents)
    .where(isNotNull(contents.title))
    .orderBy(desc(contents.readCount))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    contents: result.map(item => ({
      ...item,
      readCount: item.readCount || 0,
      likeCount: item.likeCount || 0,
    })),
  });
}

async function handleFetchPublishedArticles(searchParams: URLSearchParams) {
  const count = parseInt(searchParams.get('count') || '10') || 10;
  
  const [auth] = await db()
    .select()
    .from(wechatAuth)
    .where(eq(wechatAuth.status, 'active'))
    .limit(1);

  if (!auth || !auth.cookie) {
    return NextResponse.json({ success: false, error: '请先完成微信授权' }, { status: 400 });
  }

  try {
    const articles = await fetchWechatPublishedArticles(auth.cookie, count);
    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error('[闭环优化] 获取已发布文章失败:', error);
    return NextResponse.json({ 
      success: false, error: error instanceof Error ? error.message : '获取已发布文章失败' 
    }, { status: 500 });
  }
}

async function fetchWechatPublishedArticles(cookie: string, count: number) {
  const tokenMatch = cookie.match(/token=(\d+)/);
  const token = tokenMatch ? tokenMatch[1] : '';

  const params = new URLSearchParams({
    sub: 'list',
    sub_action: 'list_ex',
    begin: '0',
    count: String(count),
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
  const articles: Array<{
    msgId: string;
    title: string;
    author: string | null;
    digest: string | null;
    coverImage: string | null;
    sourceUrl: string;
    publishTime: number | null;
    readCount: number;
    likeCount: number;
  }> = [];

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
        coverImage: article.cover || '',
        sourceUrl: article.link || '',
        publishTime: article.update_time || article.create_time || null,
        readCount: article.read_num || 0,
        likeCount: article.like_num || 0,
      });
    } catch (parseError) {
      console.error('[闭环优化] 解析发布信息失败:', parseError);
    }
  }

  return articles;
}

async function handleCollectPublishedArticles(data: {
  articles: Array<{
    msgId: string;
    title: string;
    sourceUrl: string;
    publishTime: number | null;
    readCount: number;
    likeCount: number;
    sourceContentId?: number;
  }>;
}) {
  const now = new Date();
  const results: Array<{ title: string; success: boolean; error?: string }> = [];

  for (const article of data.articles) {
    try {
      let sourceTitle = '';
      let sourceReadCount = 0;
      let sourceLikeCount = 0;
      let sourceDigest = '';

      if (article.sourceContentId) {
        const sourceContent = await db()
          .select()
          .from(contents)
          .where(eq(contents.id, article.sourceContentId))
          .limit(1);

        if (sourceContent.length > 0) {
          sourceTitle = sourceContent[0].title;
          sourceReadCount = sourceContent[0].readCount || 0;
          sourceLikeCount = sourceContent[0].likes || 0;
          sourceDigest = sourceContent[0].digest || '';
        }
      }

      const existing = await db()
        .select()
        .from(publishedArticles)
        .where(eq(publishedArticles.articleUrl, article.sourceUrl))
        .limit(1);

      if (existing.length > 0) {
        results.push({ title: article.title, success: false, error: '文章已存在' });
        continue;
      }

      await db()
        .insert(publishedArticles)
        .values({
          title: article.title,
          content: '',
          articleUrl: article.sourceUrl,
          publishTime: article.publishTime ? new Date(article.publishTime * 1000) : now,
          sourceContentId: article.sourceContentId || null,
          sourceTitle,
          sourceReadCount,
          sourceLikeCount,
          sourceDigest,
          readCount: article.readCount || 0,
          likeCount: article.likeCount || 0,
          lookCount: 0,
          shareCount: 0,
          commentCount: 0,
          publishStatus: 'published',
          analysisStatus: 'pending',
          createdAt: now,
          updatedAt: now,
        });

      results.push({ title: article.title, success: true });
    } catch (error) {
      results.push({ 
        title: article.title, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return NextResponse.json({
    success: true,
    results,
    summary: {
      total: results.length,
      success: successCount,
      failed: failCount,
    },
  });
}
