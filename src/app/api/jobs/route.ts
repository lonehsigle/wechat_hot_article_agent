import { NextRequest, NextResponse } from 'next/server';
import { getJobDefinition, listJobs } from '@/lib/jobs/registry';
import { writeAuditEvent } from '@/lib/ops/audit';
import { finishJobRun, startJobRun } from '@/lib/ops/job-runs';

function jobResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status });
}

export async function GET() {
  return jobResponse({
    success: true,
    jobs: listJobs(),
    workerAuth: {
      header: 'x-internal-worker-token',
      configured: !!process.env.INTERNAL_WORKER_TOKEN,
      note: '未配置 INTERNAL_WORKER_TOKEN 时，/api/jobs 只能通过已登录会话访问。',
    },
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jobResponse({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const action = body.action;
  const jobName = typeof body.jobName === 'string' ? body.jobName : '';

  if (action !== 'run') {
    return jobResponse({ success: false, error: 'Invalid action. Must be run.' }, 400);
  }

  if (!jobName) {
    return jobResponse({ success: false, error: 'jobName is required' }, 400);
  }

  const job = getJobDefinition(jobName);
  if (!job) {
    return jobResponse({ success: false, error: `Job ${jobName} not found` }, 404);
  }

  const auditWarnings: string[] = [];
  const jobRun = await startJobRun({
    jobName,
    triggeredBy: request.headers.get('x-internal-worker-token') ? 'worker' : 'manual',
    inputSummary: { action, jobName },
  });
  if (!jobRun.success && jobRun.error) {
    auditWarnings.push(jobRun.error);
  }

  const started = await writeAuditEvent({
    type: 'job_started',
    message: `Job ${jobName} started`,
    data: { jobName },
  });
  if (!started.success && started.error) {
    auditWarnings.push(started.error);
  }

  const result = await job.run();

  const finished = await writeAuditEvent({
    type: result.success ? 'job_completed' : result.status === 'blocked' ? 'job_blocked' : 'job_failed',
    message: result.message,
    data: {
      jobName,
      status: result.status,
      data: result.data,
    },
  });
  if (!finished.success && finished.error) {
    auditWarnings.push(finished.error);
  }

  const runStatus = result.success ? 'succeeded' : result.status === 'blocked' ? 'blocked' : 'failed';
  const persisted = await finishJobRun({
    id: jobRun.success ? jobRun.run?.id : undefined,
    jobName,
    status: runStatus,
    startedAt: jobRun.success ? jobRun.run?.startedAt : undefined,
    outputSummary: result.data,
    errorMessage: result.success ? undefined : result.message,
    auditWarnings,
  });
  if (!persisted.success && persisted.error) {
    auditWarnings.push(persisted.error);
  }

  const status = result.success ? 200 : result.status === 'blocked' ? 501 : 500;
  return jobResponse({
    success: result.success,
    jobName,
    status: result.status,
    message: result.message,
    data: result.data,
    auditWarnings,
  }, status);
}
