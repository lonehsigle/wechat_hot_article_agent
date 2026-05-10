import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jobRuns } from '@/lib/db/schema';

export async function startJobRun(input: {
  jobName: string;
  triggeredBy?: string;
  inputSummary?: Record<string, unknown>;
}) {
  try {
    const [run] = await db().insert(jobRuns).values({
      jobName: input.jobName,
      triggeredBy: input.triggeredBy || 'manual',
      inputSummary: input.inputSummary ? JSON.stringify(input.inputSummary) : null,
      status: 'running',
      startedAt: new Date(),
      createdAt: new Date(),
    }).returning();
    return { success: true as const, run };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function finishJobRun(input: {
  id?: number;
  jobName: string;
  status: string;
  startedAt?: Date;
  outputSummary?: Record<string, unknown>;
  errorMessage?: string;
  auditWarnings?: string[];
}) {
  try {
    const finishedAt = new Date();
    const durationMs = input.startedAt ? finishedAt.getTime() - input.startedAt.getTime() : 0;
    const values = {
      status: input.status,
      outputSummary: input.outputSummary ? JSON.stringify(input.outputSummary) : null,
      errorMessage: input.errorMessage || null,
      auditWarnings: input.auditWarnings?.length ? JSON.stringify(input.auditWarnings) : null,
      finishedAt,
      durationMs,
    };

    if (input.id) {
      await db().update(jobRuns).set(values).where(eq(jobRuns.id, input.id));
    } else {
      await db().insert(jobRuns).values({
        jobName: input.jobName,
        status: input.status,
        outputSummary: values.outputSummary,
        errorMessage: values.errorMessage,
        auditWarnings: values.auditWarnings,
        startedAt: input.startedAt || finishedAt,
        finishedAt,
        durationMs,
        createdAt: new Date(),
      });
    }
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getRecentJobRuns(limit = 10) {
  try {
    const recent = await db()
      .select()
      .from(jobRuns)
      .orderBy(desc(jobRuns.startedAt))
      .limit(limit);
    return { status: 'ok' as const, recent };
  } catch (error) {
    return {
      status: 'error' as const,
      recent: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
