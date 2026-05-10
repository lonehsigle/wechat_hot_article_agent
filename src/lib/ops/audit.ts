import { db } from '@/lib/db';
import { monitorLogs } from '@/lib/db/schema';

export interface AuditEvent {
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function writeAuditEvent(event: AuditEvent): Promise<{ success: boolean; error?: string }> {
  try {
    await db().insert(monitorLogs).values({
      type: event.type,
      message: event.message,
      data: event.data ? JSON.stringify(event.data) : null,
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[audit] Failed to write audit event:', message);
    return { success: false, error: message };
  }
}
