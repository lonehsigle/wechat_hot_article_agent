import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { analysisTasks, publishedArticles } from '@/lib/db/schema';

export async function GET() {
  try {
    const database = db();
    const [articleRows, analysisRows] = await Promise.all([
      database
        .select({
          totalArticles: sql<number>`count(*)`.mapWith(Number),
          publishedArticles: sql<number>`count(*) filter (where ${publishedArticles.publishStatus} = 'published')`.mapWith(Number),
          drafts: sql<number>`count(*) filter (where ${publishedArticles.publishStatus} = 'draft')`.mapWith(Number),
        })
        .from(publishedArticles),
      database
        .select({
          analysisTasks: sql<number>`count(*)`.mapWith(Number),
        })
        .from(analysisTasks),
    ]);

    return NextResponse.json({
      totalArticles: articleRows[0]?.totalArticles ?? 0,
      publishedArticles: articleRows[0]?.publishedArticles ?? 0,
      drafts: articleRows[0]?.drafts ?? 0,
      analysisTasks: analysisRows[0]?.analysisTasks ?? 0,
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ error: '获取仪表盘统计失败' }, { status: 500 });
  }
}
