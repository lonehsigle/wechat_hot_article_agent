/**
 * 任务执行注册表。
 * Next.js API Route 不提供可靠的常驻定时能力，因此这里仅保留任务状态和手动执行。
 */

export type TaskStatus = 'idle' | 'running' | 'paused' | 'error';

export interface ScheduledTask {
  name: string;
  description: string;
  intervalMs: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  status: TaskStatus;
  runCount: number;
  errorCount: number;
  lastError: string | null;
}

export interface TaskExecutor {
  (taskName: string): Promise<void>;
}

interface TaskConfig {
  name: string;
  description: string;
  intervalMs: number;
  executor: TaskExecutor;
  enabled?: boolean;
}

interface TaskInstance {
  config: TaskConfig;
  state: ScheduledTask;
}

const TASK_REGISTRY = new Map<string, TaskInstance>();

// 默认任务配置
export const DEFAULT_TASKS: TaskConfig[] = [
  {
    name: 'syncArticleStats',
    description: '同步文章统计数据（阅读量、点赞数等）',
    intervalMs: 30 * 60 * 1000, // 30分钟
    executor: async (_taskName: string) => {
      // 实际执行逻辑由外部注入
      console.log(`[scheduler] syncArticleStats triggered at ${new Date().toISOString()}`);
    },
    enabled: true,
  },
  {
    name: 'syncWechatDrafts',
    description: '同步微信公众号草稿箱（未接入真实草稿列表 API）',
    intervalMs: 15 * 60 * 1000, // 15分钟
    executor: async (_taskName: string) => {
      console.log(`[scheduler] syncWechatDrafts triggered at ${new Date().toISOString()}`);
    },
    enabled: false,
  },
  {
    name: 'hotTopicsCache',
    description: '热点数据缓存更新（未接入真实数据源）',
    intervalMs: 10 * 60 * 1000, // 10分钟
    executor: async (_taskName: string) => {
      console.log(`[scheduler] hotTopicsCache triggered at ${new Date().toISOString()}`);
    },
    enabled: false,
  },
];

function createTaskState(config: TaskConfig): ScheduledTask {
  return {
    name: config.name,
    description: config.description,
    intervalMs: config.intervalMs,
    lastRunAt: null,
    nextRunAt: null,
    status: 'idle',
    runCount: 0,
    errorCount: 0,
    lastError: null,
  };
}

async function executeTask(instance: TaskInstance): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const { config, state } = instance;
  if (state.status === 'running') {
    console.log(`[scheduler] Task ${config.name} is already running, skip this tick`);
    return { success: true, skipped: true };
  }

  state.status = 'running';
  state.lastRunAt = new Date();
  state.nextRunAt = new Date(Date.now() + config.intervalMs);

  try {
    await config.executor(config.name);
    state.runCount += 1;
    state.status = state.status === 'running' ? 'idle' : state.status;
    state.lastError = null;
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    state.errorCount += 1;
    state.lastError = message;
    state.status = 'error';
    console.error(`[scheduler] Task ${config.name} failed:`, error);
    return { success: false, error: message };
  }
}

export function registerTask(
  name: string,
  description: string,
  intervalMs: number,
  executor: TaskExecutor,
  options?: { enabled?: boolean }
): ScheduledTask {
  if (TASK_REGISTRY.has(name)) {
    throw new Error(`Task ${name} is already registered`);
  }

  const config: TaskConfig = {
    name,
    description,
    intervalMs,
    executor,
    enabled: options?.enabled ?? true,
  };

  const state = createTaskState(config);
  if (!config.enabled) {
    state.status = 'paused';
  }

  const instance: TaskInstance = {
    config,
    state,
  };

  TASK_REGISTRY.set(name, instance);

  return { ...state };
}

export function unregisterTask(name: string): boolean {
  return TASK_REGISTRY.delete(name);
}

export async function runTaskNow(name: string): Promise<{ success: boolean; error?: string }> {
  const instance = TASK_REGISTRY.get(name);
  if (!instance) {
    return { success: false, error: `Task ${name} not found` };
  }

  try {
    return await executeTask(instance);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function getTaskStatus(name: string): ScheduledTask | null {
  const instance = TASK_REGISTRY.get(name);
  if (!instance) return null;
  return { ...instance.state };
}

export function getAllTaskStatuses(): ScheduledTask[] {
  return Array.from(TASK_REGISTRY.values()).map(instance => ({ ...instance.state }));
}

export function initDefaultTasks(executors?: Partial<Record<string, TaskExecutor>>): void {
  for (const task of DEFAULT_TASKS) {
    if (!TASK_REGISTRY.has(task.name)) {
      const executor = executors?.[task.name] || task.executor;
      registerTask(task.name, task.description, task.intervalMs, executor, {
        enabled: task.enabled,
      });
    }
  }
}

export function shutdownAllTasks(): void {
  for (const [name, instance] of TASK_REGISTRY.entries()) {
    instance.state.status = 'paused';
    instance.state.nextRunAt = null;
    console.log(`[scheduler] Task ${name} stopped`);
  }
}
