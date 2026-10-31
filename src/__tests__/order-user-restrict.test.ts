import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import {
  anonymizeUser,
  canHardDeleteUser,
  safeDeleteOrAnonymizeUser,
} from '@/lib/user-deletion';

// Mock DB and logger
jest.mock('@/lib/db', () => ({
  db: {
    $transaction: jest.fn(),
    order: {
      count: jest.fn(),
    },
    user: {
      update: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
    },
    emailVerificationToken: {
      deleteMany: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
    },
    pushSubscription: {
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('M9: User to Order onDelete Restrict & Financial History Protection', () => {
  const rootDir = process.cwd();
  const schemaPath = path.join(rootDir, 'Database', 'schema.prisma');
  const migrationDirPath = path.join(
    rootDir,
    'Database',
    'migrations',
    '20261031120000_order_user_ondelete_restrict'
  );
  const migrationSqlPath = path.join(migrationDirPath, 'migration.sql');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies Database/schema.prisma enforces onDelete: Restrict on Order.user relation', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Extract Order model block
    const orderModelMatch = schemaContent.match(/model Order \{([\s\S]*?)\n\}/);
    expect(orderModelMatch).not.toBeNull();

    const orderModelContent = orderModelMatch ? orderModelMatch[1] : '';
    // Check that user relation is onDelete: Restrict
    expect(orderModelContent).toMatch(/user\s+User\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\],\s*onDelete:\s*Restrict\)/);
    // Explicitly confirm it is NOT onDelete: Cascade
    expect(orderModelContent).not.toMatch(/user\s+User\s+@relation\([^)]*onDelete:\s*Cascade/);
  });

  it('verifies migration SQL file exists and contains correct DROP and ADD CONSTRAINT with RESTRICT', () => {
    expect(fs.existsSync(migrationDirPath)).toBe(true);
    expect(fs.existsSync(migrationSqlPath)).toBe(true);

    const sqlContent = fs.readFileSync(migrationSqlPath, 'utf8');
    expect(sqlContent).toContain('DROP CONSTRAINT');
    expect(sqlContent).toContain('Order_userId_fkey');
    expect(sqlContent).toContain('ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE');
  });

  it('canHardDeleteUser returns false when user has orders, preventing foreign key violation', async () => {
    (db.order.count as jest.Mock).mockResolvedValueOnce(3);

    const canDelete = await canHardDeleteUser('user_with_orders');
    expect(canDelete).toBe(false);
    expect(db.order.count).toHaveBeenCalledWith({
      where: { userId: 'user_with_orders' },
    });
  });

  it('canHardDeleteUser returns true when user has zero orders', async () => {
    (db.order.count as jest.Mock).mockResolvedValueOnce(0);

    const canDelete = await canHardDeleteUser('new_user_no_orders');
    expect(canDelete).toBe(true);
  });

  it('safeDeleteOrAnonymizeUser anonymizes user when orders exist without deleting the User record', async () => {
    (db.order.count as jest.Mock).mockResolvedValueOnce(2);
    (db.user.update as jest.Mock).mockResolvedValueOnce({});
    (db.session.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
    (db.refreshToken.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
    (db.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
    (db.passwordResetToken.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
    (db.pushSubscription.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 0 });

    (db.$transaction as jest.Mock).mockResolvedValueOnce([{}, { count: 1 }, { count: 1 }, { count: 0 }, { count: 0 }, { count: 0 }]);

    const result = await safeDeleteOrAnonymizeUser('user_123', 'admin@fahadali.pk');

    expect(result.success).toBe(true);
    expect(result.action).toBe('ANONYMIZED');

    // db.user.delete must NEVER be called if orders exist
    expect(db.user.delete).not.toHaveBeenCalled();

    // Verify user update masked PII and set deletedAt
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user_123' },
        data: expect.objectContaining({
          name: 'Anonymized User',
          phone: null,
          bio: null,
          avatar: null,
          password: null,
          totpSecret: null,
          totpEnabled: false,
          backupCodes: [],
          deletedAt: expect.any(Date),
        }),
      })
    );
  });

  it('safeDeleteOrAnonymizeUser performs hard delete when user has zero orders', async () => {
    (db.order.count as jest.Mock).mockResolvedValueOnce(0);
    (db.user.delete as jest.Mock).mockResolvedValueOnce({ id: 'user_empty' });

    const result = await safeDeleteOrAnonymizeUser('user_empty', 'admin@fahadali.pk');

    expect(result.success).toBe(true);
    expect(result.action).toBe('HARD_DELETED');
    expect(db.user.delete).toHaveBeenCalledWith({
      where: { id: 'user_empty' },
    });
  });

  it('anonymizeUser handles errors gracefully and returns false without throwing', async () => {
    (db.$transaction as jest.Mock).mockRejectedValueOnce(new Error('DB connection lost'));

    const result = await anonymizeUser('user_err', 'admin@fahadali.pk');
    expect(result).toBe(false);
  });
});
