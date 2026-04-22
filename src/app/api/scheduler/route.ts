import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTaskStatuses,
  getTaskStatus,
  startTask,
  stopTask,
  runTaskNow,
  initDefaultTasks,
  shutdownAllTasks,
} from '@/lib/scheduler/service';
import { apiResponse } from '@/lib/utils/api-helper';
import { syncAllArticleStats } from '@/lib/wechat/service';

// 初始化默认任务（仅在首次请求时执行）
let initialized = false;

function ensureTasksInitialized() {
  if (initialized) return;
  initialized = true;

  initDefaultTasks({
    syncArticleStats: async (_taskName: string) => {
      try {
        await syncAllArticleStats();
        console.log('[scheduler] Article stats synced successfully');
      } catch (error) {
        console.error('[scheduler] syncArticleStats failed:', error);
        throw error;
      }
    },
    syncWechatDrafts: async (_taskName: string) => {
      // 微信草稿同步占位 - 可接入具体实现
      console.log('[scheduler] syncWechatDrafts: placeholder executed');
    },
    hotTopicsCache: async (_taskName: string) => {
      // 热点缓存更新占位 - 可接入具体实现
      console.log('[scheduler] hotTopicsCache: placeholder executed');
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
 * 请求体: { action: 'start' | 'stop' | 'run', taskName?: string }
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
      case 'start': {
        const started = startTask(taskName);
        if (!started) {
          return NextResponse.json(
            apiResponse.error(`Task ${taskName} not found`),
            { status: 404 }
          );
        }
        return NextResponse.json(
          apiResponse.success({ taskName, action: 'started', status: getTaskStatus(taskName) })
        );
      }

      case 'stop': {
        const stopped = stopTask(taskName);
        if (!stopped) {
          return NextResponse.json(
            apiResponse.error(`Task ${taskName} not found`),
            { status: 404 }
          );
        }
        return NextResponse.json(
          apiResponse.success({ taskName, action: 'stopped', status: getTaskStatus(taskName) })
        );
      }

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
