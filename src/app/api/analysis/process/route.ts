import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analysisTasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const WORKER_REQUIRED_MESSAGE = '选题分析后台处理需要可靠 worker/队列承载，当前 API Route 不执行模拟分析或后台长任务。';

export async function POST(request: NextRequest) {
  let body: { taskId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const taskId = Number(body.taskId);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 });
  }

  await db().update(analysisTasks)
    .set({
      status: 'failed',
      errorMessage: WORKER_REQUIRED_MESSAGE,
      completedAt: new Date(),
    })
    .where(eq(analysisTasks.id, taskId));

  return NextResponse.json({
    success: false,
    error: WORKER_REQUIRED_MESSAGE,
  }, { status: 501 });
}
