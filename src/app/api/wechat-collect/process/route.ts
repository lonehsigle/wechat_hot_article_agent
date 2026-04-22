import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatAuth, wechatSubscriptions, collectedArticles, collectTasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { taskId } = body;

  if (!taskId) {
    return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 });
  }

  const [task] = await db().select().from(collectTasks).where(eq(collectTasks.id, taskId));
  if (!task) {
    return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
  }

  const [subscription] = await db().select().from(wechatSubscriptions).where(eq(wechatSubscriptions.id, task.subscriptionId!));
  if (!subscription) {
    return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
  }

  await db().update(collectTasks)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(collectTasks.id, taskId));

  try {
    // 后台自动处理功能暂未实现，返回错误提示
    await db().update(collectTasks)
      .set({
        status: 'failed',
        errorMessage: '后台自动处理功能暂未实现，请手动选择文章进行采集',
        completedAt: new Date(),
      })
      .where(eq(collectTasks.id, taskId));

    return NextResponse.json({
      success: false,
      error: '后台自动处理功能暂未实现，请手动选择文章进行采集',
    });
  } catch (error) {
    console.error('Collect error:', error);
    
    await db().update(collectTasks)
      .set({ 
        status: 'failed', 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date() 
      })
      .where(eq(collectTasks.id, taskId));
    
    return NextResponse.json({ success: false, error: 'Collect failed' }, { status: 500 });
  }
}

// generateMockArticles 已移除 - 后台自动处理功能暂未实现，请手动选择文章进行采集
// function generateMockArticles(...) { ... }
// function generateMockContent(...) { ... }
