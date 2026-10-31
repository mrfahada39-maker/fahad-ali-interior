import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { recordAuditLog } from '@/lib/db-utils';
import { SITE_CONFIG } from '@/lib/site-config';

export interface AnonymizeUserResult {
  success: boolean;
  action: 'ANONYMIZED' | 'HARD_DELETED';
  error?: string;
}

/**
 * Anonymizes a user record to comply with privacy/right-to-be-forgotten requests
 * while strictly preserving financial and order history required for accounting and tax records.
 */
export async function anonymizeUser(userId: string, deletedBy?: string): Promise<boolean> {
  try {
    const timestamp = Date.now();
    await db.$transaction([
      // 1. Anonymize user profile & sensitive fields
      db.user.update({
        where: { id: userId },
        data: {
          name: 'Anonymized User',
          email: `anonymized_${userId}_${timestamp}@deleted.${SITE_CONFIG.domain}`,
          phone: null,
          bio: null,
          avatar: null,
          password: null,
          totpSecret: null,
          totpEnabled: false,
          backupCodes: [],
          deletedAt: new Date(),
          tags: [],
          updatedBy: deletedBy || 'SYSTEM',
        },
      }),

      // 2. Invalidate all active user sessions & refresh tokens
      db.session.deleteMany({ where: { userId } }),
      db.refreshToken.deleteMany({ where: { userId } }),
      db.emailVerificationToken.deleteMany({ where: { userId } }),
      db.passwordResetToken.deleteMany({ where: { userId } }),
      db.pushSubscription.deleteMany({ where: { userId } }),
    ]);

    await recordAuditLog({
      userId: deletedBy || null,
      action: 'USER_ANONYMIZED',
      entity: 'User',
      entityId: userId,
      metadata: { anonymizedAt: new Date().toISOString() },
    });

    logger.info('user.anonymized', { userId, deletedBy });
    return true;
  } catch (err) {
    logger.error('Failed to anonymize user', err, { userId });
    return false;
  }
}

/**
 * Checks whether a user can be safely hard-deleted or must be anonymized.
 * Returns true if the user has no orders and can be hard deleted.
 */
export async function canHardDeleteUser(userId: string): Promise<boolean> {
  const orderCount = await db.order.count({
    where: { userId },
  });
  return orderCount === 0;
}

/**
 * Deletes or anonymizes a user depending on whether orders exist.
 * - If user has 0 orders: hard delete is permissible.
 * - If user has orders: foreign key onDelete: Restrict prevents deletion; user is anonymized.
 */
export async function safeDeleteOrAnonymizeUser(
  userId: string,
  deletedBy?: string
): Promise<AnonymizeUserResult> {
  try {
    const hasOrders = (await db.order.count({ where: { userId } })) > 0;
    if (hasOrders) {
      const ok = await anonymizeUser(userId, deletedBy);
      if (!ok) return { success: false, action: 'ANONYMIZED', error: 'Failed to anonymize user' };
      return { success: true, action: 'ANONYMIZED' };
    }

    // No orders, hard delete safe
    await db.user.delete({
      where: { id: userId },
    });

    await recordAuditLog({
      userId: deletedBy || null,
      action: 'USER_HARD_DELETED',
      entity: 'User',
      entityId: userId,
    });

    return { success: true, action: 'HARD_DELETED' };
  } catch (err) {
    logger.error('Error during safe user deletion/anonymization', err, { userId });
    return { success: false, action: 'HARD_DELETED', error: 'User deletion failed' };
  }
}
