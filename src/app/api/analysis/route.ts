import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analysisTasks, analysisArticles, insightReports, generatedArticles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

interface ArticleData {
  title: string;
  author: string;
  url: string;
  readCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  publishDate?: string;
  content?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  const action = searchParams.get('action');

  const database = db();

  if (taskId && action === 'status') {
    const tasks = await database.select().from(analysisTasks).where(eq(analysisTasks.id, parseInt(taskId)));
    if (tasks.length === 0) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }
    const task = tasks[0];
    const articles = await database.select().from(analysisArticles).where(eq(analysisArticles.taskId, parseInt(taskId)));
    
    return NextResponse.json({
      task,
      analyzedCount: articles.length,
      progress: task.totalArticles ? Math.round((articles.length / task.totalArticles) * 100) : 0,
    });
  }

  if (taskId && action === 'report') {
    const reports = await database.select().from(insightReports).where(eq(insightReports.taskId, parseInt(taskId)));
    if (reports.length === 0) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 });
    }
    return NextResponse.json(reports[0]);
  }

  const tasks = await database.select().from(analysisTasks).orderBy(desc(analysisTasks.createdAt));
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, keyword, taskId, articles, report } = body;
  const database = db();

  if (action === 'start') {
    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: '请输入关键词' }, { status: 400 });
    }

    const [task] = await database.insert(analysisTasks).values({
      keyword: keyword.trim(),
      status: 'pending',
      totalArticles: 0,
      analyzedArticles: 0,
    }).returning();

    analyzeKeyword(task.id, keyword.trim());

    return NextResponse.json({ success: true, taskId: task.id });
  }

  if (action === 'update-progress') {
    if (!taskId) {
      return NextResponse.json({ error: '缺少任务ID' }, { status: 400 });
    }

    await database.update(analysisTasks)
      .set({
        totalArticles: body.totalArticles,
        analyzedArticles: body.analyzedArticles,
        status: body.status || 'processing',
        startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
        completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
        errorMessage: body.errorMessage,
      })
      .where(eq(analysisTasks.id, taskId));

    return NextResponse.json({ success: true });
  }

  if (action === 'save-articles') {
    if (!taskId || !articles || !Array.isArray(articles)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    for (const article of articles) {
      await database.insert(analysisArticles).values({
        taskId,
        title: article.title,
        author: article.author || '未知',
        url: article.url || '',
        summary: article.summary || '',
        readCount: article.readCount || 0,
        likeCount: article.likeCount || 0,
        commentCount: article.commentCount || 0,
        shareCount: article.shareCount || 0,
        engagementRate: article.engagementRate || 0,
        publishDate: article.publishDate,
        content: article.content,
        keywords: article.keywords || [],
        analyzedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'save-report') {
    if (!taskId || !report) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const [savedReport] = await database.insert(insightReports).values({
      taskId,
      topLikesArticles: report.topLikesArticles || [],
      topEngagementArticles: report.topEngagementArticles || [],
      wordCloud: report.wordCloud || [],
      insights: report.insights || [],
      topicSuggestions: report.topicSuggestions || [],
    }).returning();

    await database.update(analysisTasks)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(analysisTasks.id, taskId));

    return NextResponse.json({ success: true, report: savedReport });
  }

  if (action === 'save-article') {
    const { title, content } = body;
    if (!taskId || !title || !content) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const [article] = await database.insert(generatedArticles).values({
      taskId,
      title,
      content,
      summary: content.substring(0, 200),
      wordCount: content.length,
      status: 'draft',
    }).returning();

    return NextResponse.json({ success: true, article });
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 });
}

async function analyzeKeyword(taskId: number, keyword: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analysis/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, keyword }),
    });
  } catch (error) {
    console.error('Failed to start analysis:', error);
  }
}
