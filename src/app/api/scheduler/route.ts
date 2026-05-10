import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTaskStatuses,
  getTaskStatus,
  runTaskNow,
  initDefaultTasks,
  shutdownAllTasks,
} from '@/lib/scheduler/service';
import { apiResponse } from '@/lib/utils/api-helper';
import { getJobDefinition } from '@/lib/jobs/registry';

// 初始化默认任务（仅在首次请求时执行）
let initialized = false;

function ensureTasksInitialized() {
  if (initialized) return;
  initialized = true;

  initDefaultTasks({
    syncArticleStats: async (_taskName: string) => {
      const result = await getJobDefinition('syncArticleStats')?.run();
      if (!result?.success) {
        throw new Error(result?.message || '文章统计同步失败');
      }
    },
    syncWechatDrafts: async (_taskName: string) => {
      const result = await getJobDefinition('syncWechatDrafts')?.run();
      if (!result?.success) {
        throw new Error(result?.message || '微信公众号草稿同步失败。');
      }
    },
    hotTopicsCache: async (_taskName: string) => {
      const result = await getJobDefinition('refreshHotTopics')?.run();
      throw new Error(result?.message || '热点缓存自动更新尚未接入真实数据源，请在热门选题页面手动拉取真实热点。');
    },
  });
}

/**
 * GET /api/scheduler
 * 获取所有任务状态
 */
export async function GET(_request: NextRequest) {
  try {
    ensureTasksInitialized();
    const tasks = getAllTaskStatuses();
    return NextResponse.json(apiResponse.success(tasks));
  } catch (error) {
    console.error('Scheduler GET error:', error);
    return NextResponse.json(
      apiResponse.error(error instanceof Error ? error.message : '获取任务状态失败'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduler
 * 请求体: { action: 'run' | 'shutdown', taskName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    ensureTasksInitialized();
    const body = await request.json();
    const { action, taskName } = body;

    if (!action || !['start', 'stop', 'run', 'shutdown'].includes(action)) {
      return NextResponse.json(
        apiResponse.error('Invalid action. Must be one of: start, stop, run, shutdown'),
        { status: 400 }
      );
    }

    if (action === 'start' || action === 'stop') {
      return NextResponse.json(
        apiResponse.error('API Route 不提供可靠的常驻定时调度，请使用外部 cron/worker 调用 run。'),
        { status: 501 }
      );
    }

    // 针对所有任务的操作
    if (!taskName) {
      if (action === 'shutdown') {
        shutdownAllTasks();
        return NextResponse.json(
          apiResponse.success({ message: 'All tasks stopped' })
        );
      }
      return NextResponse.json(
        apiResponse.error('taskName is required for start/stop/run actions'),
        { status: 400 }
      );
    }

    // 针对单个任务的操作
    switch (action) {
      case 'run': {
        const runResult = await runTaskNow(taskName);
        if (!runResult.success) {
          return NextResponse.json(
            apiResponse.error(runResult.error || `Task ${taskName} execution failed`),
            { status: 500 }
          );
        }
        return NextResponse.json(
          apiResponse.success({ taskName, action: 'executed', status: getTaskStatus(taskName) })
        );
      }

      default:
        return NextResponse.json(
          apiResponse.error('Unsupported action'),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Scheduler POST error:', error);
    return NextResponse.json(
      apiResponse.error(error instanceof Error ? error.message : '操作失败'),
      { status: 500 }
    );
  }
}
