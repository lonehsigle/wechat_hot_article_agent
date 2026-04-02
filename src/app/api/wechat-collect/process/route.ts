import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatAuth, wechatSubscriptions, collectedArticles, collectTasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { taskId } = body;

  if (!taskId) {
    return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
  }

  const [task] = await db().select().from(collectTasks).where(eq(collectTasks.id, taskId));
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const [subscription] = await db().select().from(wechatSubscriptions).where(eq(wechatSubscriptions.id, task.subscriptionId!));
  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  await db().update(collectTasks)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(collectTasks.id, taskId));

  try {
    const mockArticles = generateMockArticles(subscription, task.totalArticles || 5);
    
    for (let i = 0; i < mockArticles.length; i++) {
      const article = mockArticles[i];
      
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
          publishTime: article.publishTime,
          readCount: article.readCount,
          likeCount: article.likeCount,
        });
      }
      
      await db().update(collectTasks)
        .set({ collectedArticles: i + 1 })
        .where(eq(collectTasks.id, taskId));
    }
    
    await db().update(collectTasks)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(collectTasks.id, taskId));
    
    await db().update(wechatSubscriptions)
      .set({
        totalArticles: (subscription.totalArticles || 0) + mockArticles.length,
        lastArticleTime: new Date(),
        lastMonitorAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wechatSubscriptions.id, subscription.id));
    
    return NextResponse.json({ success: true, collected: mockArticles.length });
  } catch (error) {
    console.error('Collect error:', error);
    
    await db().update(collectTasks)
      .set({ 
        status: 'failed', 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date() 
      })
      .where(eq(collectTasks.id, taskId));
    
    return NextResponse.json({ error: 'Collect failed' }, { status: 500 });
  }
}

function generateMockArticles(subscription: { id: number; biz: string; name: string }, count: number) {
  const titles = [
    '深度解析：AI时代的机遇与挑战',
    '2024年最值得关注的10个技术趋势',
    '如何打造高效的内容创作工作流',
    '从0到1：构建个人知识体系',
    '产品经理必读：用户增长方法论',
    '技术写作的艺术：让复杂变简单',
    '数据驱动决策的实践指南',
    '创业者如何突破增长瓶颈',
    '职场进阶：从执行者到管理者',
    '阅读的力量：改变人生的10本书',
  ];
  
  const digests = [
    '本文深入探讨了人工智能时代带来的机遇与挑战，为读者提供全面的视角...',
    '盘点2024年最值得关注的技术趋势，帮助读者把握行业发展方向...',
    '分享一套经过验证的高效内容创作工作流，提升创作效率和质量...',
    '从零开始构建个人知识体系的方法论，助你成为更好的自己...',
    '详解用户增长的核心方法论，产品经理必读的实战指南...',
  ];
  
  const articles = [];
  
  for (let i = 0; i < count; i++) {
    const titleIndex = (subscription.id * 3 + i) % titles.length;
    const digestIndex = (subscription.id * 2 + i) % digests.length;
    const msgId = `${subscription.biz}_${Date.now()}_${i}`;
    
    articles.push({
      msgId,
      title: titles[titleIndex],
      author: subscription.name,
      digest: digests[digestIndex],
      content: generateMockContent(titles[titleIndex]),
      contentHtml: `<p>${digests[digestIndex]}</p>`,
      coverImage: null,
      sourceUrl: `https://mp.weixin.qq.com/s/${msgId}`,
      publishTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      readCount: Math.floor(Math.random() * 10000) + 100,
      likeCount: Math.floor(Math.random() * 500) + 10,
    });
  }
  
  return articles;
}

function generateMockContent(title: string): string {
  return `${title}

这是一篇模拟采集的文章内容。在实际应用中，这里会是从微信公众号文章页面解析出的完整正文内容。

文章正文会包含：
- 完整的段落文本
- 图片链接（已本地化存储）
- 格式化的排版

采集功能支持：
1. 增量采集 - 只采集新发布的文章
2. 全量采集 - 采集历史文章
3. 实时监控 - 分钟级感知新文章

导出功能支持：
1. Markdown格式
2. PDF格式
3. 批量导出

---
采集时间：${new Date().toLocaleString('zh-CN')}
`;
}
