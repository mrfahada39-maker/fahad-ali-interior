import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface AuditLogOptions {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Persists an immutable audit log entry for enterprise tracking and compliance.
 */
export async function recordAuditLog(options: AuditLogOptions): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        ip: options.ip || null,
        userAgent: options.userAgent || null,
        metadata: options.metadata || undefined,
      },
    });
  } catch (err) {
    // Non-blocking: Audit log failure should be logged but not crash the primary transaction
    logger.warn('audit_log.failed', {
      action: options.action,
      entity: options.entity,
      error: (err as Error)?.message,
    });
  }
}

/**
 * Runs operations within an isolated Prisma transaction with tuned timeout limits.
 */
export async function executeTransaction<T>(
  action: (tx: any) => Promise<T>,
  options?: { maxWait?: number; timeout?: number }
): Promise<T> {
  const maxWait = options?.maxWait ?? 5000;
  const timeout = options?.timeout ?? 10000;

  return await (db as any).$transaction(action, {
    maxWait,
    timeout,
  });
}

/**
 * Standardized soft-delete helper that marks deletedAt and creates an audit record.
 */
export async function softDeleteRecord(
  modelDelegate: any,
  id: string,
  entityName: string,
  actorUserId?: string
): Promise<any> {
  const record = await modelDelegate.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: 'SOFT_DELETE',
    entity: entityName,
    entityId: id,
  });

  return record;
}
