import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analysisTasks, analysisArticles, insightReports, generatedArticles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  const action = searchParams.get('action');

  try {
  const database = db();

  if (taskId && action === 'status') {
    const parsedTaskId = parseInt(taskId);
    if (isNaN(parsedTaskId)) {
      return NextResponse.json({ success: false, error: 'Invalid taskId' }, { status: 400 });
    }
    const tasks = await database.select().from(analysisTasks).where(eq(analysisTasks.id, parsedTaskId));
    if (tasks.length === 0) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
    }
    const task = tasks[0];
    const articles = await database.select().from(analysisArticles).where(eq(analysisArticles.taskId, parsedTaskId));
    
    return NextResponse.json({
      success: true,
      task,
      analyzedCount: articles.length,
      progress: task.totalArticles ? Math.round((articles.length / task.totalArticles) * 100) : 0,
    });
  }

  if (taskId && action === 'report') {
    const parsedTaskId = parseInt(taskId);
    if (isNaN(parsedTaskId)) {
      return NextResponse.json({ success: false, error: 'Invalid taskId' }, { status: 400 });
    }
    const reports = await database.select().from(insightReports).where(eq(insightReports.taskId, parsedTaskId));
    if (reports.length === 0) {
      return NextResponse.json({ success: false, error: '报告不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, report: reports[0] });
  }

  const tasks = await database.select().from(analysisTasks).orderBy(desc(analysisTasks.createdAt));
  return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Analysis GET API error:', error);
    return NextResponse.json({ 
      success: false, error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, keyword, taskId, articles, report } = body;
    const database = db();

    if (action === 'start') {
      if (!keyword || !keyword.trim()) {
        return NextResponse.json({ success: false, error: '请输入关键词' }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: '选题分析后台任务需要可靠 worker/队列承载，当前 API Route 不启动后台长任务。请通过 save-articles/save-report 写入真实分析结果，或接入独立 worker 后再启用。',
      }, { status: 501 });
    }

    if (action === 'update-progress') {
      if (!taskId) {
        return NextResponse.json({ success: false, error: '缺少任务ID' }, { status: 400 });
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
        return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
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
          keywords: JSON.stringify(article.keywords || []),
          analyzedAt: new Date(),
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'save-report') {
      if (!taskId || !report) {
        return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
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
        return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
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

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '操作失败' }, { status: 500 });
  }
}
