import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { publishedArticles, articleStats, contents, monitorCategories } from '@/lib/db/schema';
import { desc, gte, eq } from 'drizzle-orm';
import { syncAllArticleStats } from '@/lib/wechat/service';

// 自动同步锁，防止并发触发
let autoSyncInProgress = false;

async function maybeAutoSyncStats(): Promise<void> {
  if (autoSyncInProgress) return;

  try {
    const database = db();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // 检查最近一次统计记录时间
    const latestStats = await database
      .select()
      .from(articleStats)
      .orderBy(desc(articleStats.recordTime))
      .limit(1);

    const needsSync =
      latestStats.length === 0 ||
      (latestStats[0].recordTime && latestStats[0].recordTime < thirtyMinutesAgo);

    if (needsSync) {
      autoSyncInProgress = true;
      console.log('[analytics] Auto-syncing article stats (data older than 30min)');
      const result = await syncAllArticleStats();
      console.log(`[analytics] Auto-sync result: synced=${result.synced}, failed=${result.failed}, skipped=${result.skipped}`);
    }
  } catch (err) {
    console.error('[analytics] Auto-sync failed:', err);
  } finally {
    autoSyncInProgress = false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30d';

  const database = db();
  
  // 如果请求带 autoSync 参数或数据超过30分钟未更新，自动触发同步
  const shouldAutoSync = searchParams.get('autoSync') !== 'false';
  if (shouldAutoSync) {
    // 使用 void 允许后台执行，不阻塞响应
    void maybeAutoSyncStats();
  }

  const now = new Date();
  let startDate: Date;
  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  try {
    const articles = await database
      .select()
      .from(publishedArticles)
      .where(gte(publishedArticles.createdAt, startDate))
      .orderBy(desc(publishedArticles.createdAt));

    const stats = await database
      .select()
      .from(articleStats)
      .where(gte(articleStats.recordTime, startDate));

    const totalArticles = articles.length;
    const totalReads = stats.reduce((sum, s) => sum + (s.readCount || 0), 0);
    const totalLikes = stats.reduce((sum, s) => sum + (s.likeCount || 0), 0);
    
    const avgReadRate = stats.length > 0 
      ? (totalReads / stats.length) * 0.1
      : 0;

    const articleStatsMap = new Map<number, { reads: number; likes: number }>();
    stats.forEach(s => {
      if (s.articleId) {
        const existing = articleStatsMap.get(s.articleId) || { reads: 0, likes: 0 };
        existing.reads = Math.max(existing.reads, s.readCount || 0);
        existing.likes = Math.max(existing.likes, s.likeCount || 0);
        articleStatsMap.set(s.articleId, existing);
      }
    });

    const topArticles = articles
      .map(a => ({
        id: a.id,
        title: a.title,
        readCount: articleStatsMap.get(a.id)?.reads || 0,
        likeCount: articleStatsMap.get(a.id)?.likes || 0,
        publishTime: a.createdAt,
      }))
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, 5);

    const weeklyTrend: Array<{ date: string; articles: number; reads: number }> = [];
    for (let i = range === '7d' ? 6 : range === '90d' ? 12 : 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * (range === '90d' ? 7 : 1) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dateStr + 'T23:59:59');
      
      const dayArticles = articles.filter(a => 
        a.createdAt && a.createdAt >= dayStart && a.createdAt <= dayEnd
      ).length;
      
      const dayReads = stats.filter(s => 
        s.recordTime >= dayStart && s.recordTime <= dayEnd
      ).reduce((sum, s) => sum + (s.readCount || 0), 0);

      weeklyTrend.push({
        date: dateStr,
        articles: dayArticles,
        reads: dayReads,
      });
    }

    // 通过 publishedArticles.sourceContentId -> contents.categoryId -> monitorCategories 获取真实分类统计
    const articleIds = articles.map(a => a.id);
    let categoryStats: Array<{ category: string; count: number; avgReads: number }> = [];

    if (articleIds.length > 0) {
      // 查询已发布文章关联的源内容分类
      const articleContentCategories = await database
        .select({
          articleId: publishedArticles.id,
          categoryId: contents.categoryId,
          categoryName: monitorCategories.name,
        })
        .from(publishedArticles)
        .leftJoin(contents, eq(publishedArticles.sourceContentId, contents.id))
        .leftJoin(monitorCategories, eq(contents.categoryId, monitorCategories.id))
        .where(gte(publishedArticles.createdAt, startDate));

      // 按分类分组统计
      const categoryMap = new Map<string, { articleIds: number[]; totalReads: number }>();
      articleContentCategories.forEach(row => {
        const categoryName = row.categoryName || '未分类';
        const existing = categoryMap.get(categoryName) || { articleIds: [], totalReads: 0 };
        existing.articleIds.push(row.articleId);
        const reads = articleStatsMap.get(row.articleId)?.reads || 0;
        existing.totalReads += reads;
        categoryMap.set(categoryName, existing);
      });

      categoryStats = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          count: data.articleIds.length,
          avgReads: data.articleIds.length > 0 ? Math.round(data.totalReads / data.articleIds.length) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    }

    return NextResponse.json({
      success: true,
      totalArticles,
      totalReads,
      totalLikes,
      avgReadRate,
      topArticles,
      weeklyTrend,
      categoryStats,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取统计数据失败',
      totalArticles: 0,
      totalReads: 0,
      totalLikes: 0,
      avgReadRate: 0,
      topArticles: [],
      weeklyTrend: [],
      categoryStats: [],
    }, { status: 500 });
  }
}
