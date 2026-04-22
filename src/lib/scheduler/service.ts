/**
 * 轻量级任务调度器 - 基于 setInterval 实现，无需 node-cron 依赖
 * 支持任务注册、取消、查看状态
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
  timer: NodeJS.Timeout | null;
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
    description: '同步微信公众号草稿箱',
    intervalMs: 15 * 60 * 1000, // 15分钟
    executor: async (_taskName: string) => {
      console.log(`[scheduler] syncWechatDrafts triggered at ${new Date().toISOString()}`);
    },
    enabled: true,
  },
  {
    name: 'hotTopicsCache',
    description: '热点数据缓存更新',
    intervalMs: 10 * 60 * 1000, // 10分钟
    executor: async (_taskName: string) => {
      console.log(`[scheduler] hotTopicsCache triggered at ${new Date().toISOString()}`);
    },
    enabled: true,
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

async function executeTask(instance: TaskInstance): Promise<void> {
  const { config, state } = instance;
  if (state.status === 'running') {
    console.log(`[scheduler] Task ${config.name} is already running, skip this tick`);
    return;
  }

  state.status = 'running';
  state.lastRunAt = new Date();
  state.nextRunAt = new Date(Date.now() + config.intervalMs);

  try {
    await config.executor(config.name);
    state.runCount += 1;
    state.status = state.status === 'running' ? 'idle' : state.status;
  } catch (error) {
    state.errorCount += 1;
    state.lastError = error instanceof Error ? error.message : String(error);
    state.status = 'error';
    console.error(`[scheduler] Task ${config.name} failed:`, error);
  }
}

function startTimer(instance: TaskInstance): void {
  if (instance.timer) {
    clearInterval(instance.timer);
  }

  instance.state.nextRunAt = new Date(Date.now() + instance.config.intervalMs);
  instance.timer = setInterval(() => {
    executeTask(instance).catch(err => {
      console.error(`[scheduler] Uncaught error in task ${instance.config.name}:`, err);
    });
  }, instance.config.intervalMs);

  // 立即执行一次（可选，视需求而定）
  // executeTask(instance);
}

export function registerTask(
  name: string,
  description: string,
  intervalMs: number,
  executor: TaskExecutor,
  options?: { enabled?: boolean; runImmediately?: boolean }
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
  const instance: TaskInstance = {
    config,
    timer: null,
    state,
  };

  TASK_REGISTRY.set(name, instance);

  if (config.enabled) {
    startTimer(instance);
    if (options?.runImmediately) {
      executeTask(instance).catch(console.error);
    }
  }

  return { ...state };
}

export function unregisterTask(name: string): boolean {
  const instance = TASK_REGISTRY.get(name);
  if (!instance) return false;

  if (instance.timer) {
    clearInterval(instance.timer);
    instance.timer = null;
  }

  TASK_REGISTRY.delete(name);
  return true;
}

export function startTask(name: string): boolean {
  const instance = TASK_REGISTRY.get(name);
  if (!instance) return false;

  if (instance.timer) {
    return true; // 已经在运行
  }

  startTimer(instance);
  instance.state.status = 'idle';
  return true;
}

export function stopTask(name: string): boolean {
  const instance = TASK_REGISTRY.get(name);
  if (!instance) return false;

  if (instance.timer) {
    clearInterval(instance.timer);
    instance.timer = null;
  }

  instance.state.status = 'paused';
  instance.state.nextRunAt = null;
  return true;
}

export async function runTaskNow(name: string): Promise<{ success: boolean; error?: string }> {
  const instance = TASK_REGISTRY.get(name);
  if (!instance) {
    return { success: false, error: `Task ${name} not found` };
  }

  try {
    await executeTask(instance);
    return { success: true };
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
    if (instance.timer) {
      clearInterval(instance.timer);
      instance.timer = null;
    }
    instance.state.status = 'paused';
    instance.state.nextRunAt = null;
    console.log(`[scheduler] Task ${name} stopped`);
  }
}

// 全局清理钩子（在 Next.js 开发模式下热重载时清理）
if (typeof process !== 'undefined') {
  const cleanup = () => {
    shutdownAllTasks();
  };
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}
