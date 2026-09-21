import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { recordAuditLog } from '@/lib/db-utils';

export type RecycleBinEntityType = 'CATEGORY' | 'PRODUCT' | 'ORDER' | 'REVIEW';

export interface MoveToRecycleBinParams {
  entityType: RecycleBinEntityType;
  entityId: string;
  name: string;
  payload: Record<string, any>;
  deletedBy?: string | null;
}

export interface ListRecycleBinParams {
  entityType?: RecycleBinEntityType | 'ALL';
  search?: string;
  skip?: number;
  take?: number;
}

/**
 * Move a record to the dedicated RecycleBin table.
 * Preserves a complete JSON snapshot of the record before deletion.
 */
export async function moveToRecycleBin(params: MoveToRecycleBinParams) {
  const { entityType, entityId, name, payload, deletedBy } = params;

  // Clean payload so non-serializable objects (Dates, Decimals) serialize cleanly to JSON
  const serializedPayload = JSON.parse(JSON.stringify(payload));

  const entry = await db.recycleBin.create({
    data: {
      entityType,
      entityId,
      name: name || `${entityType} ${entityId}`,
      payload: serializedPayload,
      deletedBy: deletedBy || null,
      deletedAt: new Date(),
    },
  });

  await recordAuditLog({
    userId: deletedBy || null,
    action: 'MOVE_TO_RECYCLE_BIN',
    entity: entityType,
    entityId,
    metadata: {
      recycleBinId: entry.id,
      name,
    },
  });

  logger.info('recycle_bin.item_archived', {
    recycleBinId: entry.id,
    entityType,
    entityId,
    name,
    deletedBy,
  });

  return entry;
}

/**
 * List items from RecycleBin with per-section breakdown and search support.
 */
export async function listRecycleBinItems(params: ListRecycleBinParams = {}) {
  const { entityType = 'ALL', search, skip = 0, take = 50 } = params;

  const where: any = {};
  if (entityType && entityType !== 'ALL') {
    where.entityType = entityType;
  }

  if (search && search.trim()) {
    const query = search.trim();
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { entityId: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [items, totalCount, categoryCount, productCount, orderCount, reviewCount] = await Promise.all([
    db.recycleBin.findMany({
      where,
      orderBy: { deletedAt: 'desc' },
      skip,
      take,
    }),
    db.recycleBin.count({ where }),
    db.recycleBin.count({ where: { entityType: 'CATEGORY' } }),
    db.recycleBin.count({ where: { entityType: 'PRODUCT' } }),
    db.recycleBin.count({ where: { entityType: 'ORDER' } }),
    db.recycleBin.count({ where: { entityType: 'REVIEW' } }),
  ]);

  return {
    items,
    totalCount,
    counts: {
      ALL: categoryCount + productCount + orderCount + reviewCount,
      CATEGORY: categoryCount,
      PRODUCT: productCount,
      ORDER: orderCount,
      REVIEW: reviewCount,
    },
  };
}

/**
 * Restore an item from RecycleBin back into its original active table.
 */
export async function restoreFromRecycleBin(recycleBinId: string, actorUserId?: string) {
  const entry = await db.recycleBin.findUnique({
    where: { id: recycleBinId },
  });

  if (!entry) {
    throw new Error('Item not found in Recycle Bin');
  }

  const payload = (entry.payload as any) || {};
  let restoredRecord: any = null;

  switch (entry.entityType) {
    case 'CATEGORY': {
      const categoryData = {
        id: entry.entityId,
        name: payload.name || entry.name,
        description: payload.description || null,
        image: payload.image || null,
        icon: payload.icon || null,
        items: payload.items || 'View Collection',
        isPromo: Boolean(payload.isPromo),
        order: Number(payload.order) || 0,
        isActive: true,
        deletedAt: null,
      };

      restoredRecord = await db.category.upsert({
        where: { id: entry.entityId },
        update: {
          ...categoryData,
          updatedAt: new Date(),
        },
        create: categoryData,
      });
      break;
    }

    case 'PRODUCT': {
      const productData = {
        id: entry.entityId,
        name: payload.name || entry.name,
        description: payload.description || null,
        price: payload.price,
        category: payload.category || 'General',
        image: payload.image || '/images/placeholder.jpg',
        material: payload.material || null,
        dimensions: payload.dimensions || null,
        stockCount: Number(payload.stockCount) || 0,
        isPremium: Boolean(payload.isPremium),
        specs: payload.specs || null,
        images: Array.isArray(payload.images) ? payload.images : [],
        categoryId: payload.categoryId || null,
        deletedAt: null,
      };

      restoredRecord = await db.product.upsert({
        where: { id: entry.entityId },
        update: {
          ...productData,
          updatedAt: new Date(),
        },
        create: productData,
      });
      break;
    }

    case 'ORDER': {
      restoredRecord = await db.order.update({
        where: { id: entry.entityId },
        data: { deletedAt: null },
      }).catch(async () => {
        // If hard-deleted, we acknowledge restoration note
        return { id: entry.entityId, note: 'Order archive reference' };
      });
      break;
    }

    case 'REVIEW': {
      restoredRecord = await db.review.update({
        where: { id: entry.entityId },
        data: { deletedAt: null },
      }).catch(async () => {
        return { id: entry.entityId, note: 'Review archive reference' };
      });
      break;
    }

    default:
      throw new Error(`Unsupported entity type: ${entry.entityType}`);
  }

  // Once safely restored, permanently remove from RecycleBin table
  await db.recycleBin.delete({
    where: { id: recycleBinId },
  });

  await recordAuditLog({
    userId: actorUserId || null,
    action: 'RESTORE_FROM_RECYCLE_BIN',
    entity: entry.entityType,
    entityId: entry.entityId,
    metadata: {
      recycleBinId,
      name: entry.name,
    },
  });

  logger.info('recycle_bin.item_restored', {
    recycleBinId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    actorUserId,
  });

  return {
    success: true,
    restoredRecord,
    entityType: entry.entityType,
  };
}

/**
 * Permanently delete a single item from the RecycleBin table.
 */
export async function permanentlyDeleteFromRecycleBin(recycleBinId: string, actorUserId?: string) {
  const item = await db.recycleBin.findUnique({
    where: { id: recycleBinId },
  });

  if (!item) {
    throw new Error('Item not found in Recycle Bin');
  }

  await db.recycleBin.delete({
    where: { id: recycleBinId },
  });

  await recordAuditLog({
    userId: actorUserId || null,
    action: 'PERMANENT_PURGE_RECYCLE_BIN',
    entity: item.entityType,
    entityId: item.entityId,
    metadata: {
      recycleBinId,
      name: item.name,
    },
  });

  logger.info('recycle_bin.item_permanently_deleted', {
    recycleBinId,
    entityType: item.entityType,
    name: item.name,
  });

  return { success: true, deletedId: recycleBinId };
}

/**
 * Empty the RecycleBin completely or purge a specific section.
 */
export async function emptyRecycleBin(entityType?: RecycleBinEntityType, actorUserId?: string) {
  const where: any = {};
  if (entityType) {
    where.entityType = entityType;
  }

  const result = await db.recycleBin.deleteMany({
    where,
  });

  await recordAuditLog({
    userId: actorUserId || null,
    action: 'EMPTY_RECYCLE_BIN',
    entity: entityType || 'ALL',
    metadata: {
      deletedCount: result.count,
    },
  });

  logger.info('recycle_bin.emptied', {
    entityType: entityType || 'ALL',
    deletedCount: result.count,
    actorUserId,
  });

  return {
    success: true,
    deletedCount: result.count,
    section: entityType || 'ALL',
  };
}
