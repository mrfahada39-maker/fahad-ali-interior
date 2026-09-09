import { describe, it, expect, jest } from '@jest/globals';
import { isTransientDbError, checkDatabaseHealth } from '@/lib/db';
import { recordAuditLog, executeTransaction } from '@/lib/db-utils';

describe('Database Resiliency & Transient Fault Detection', () => {
  it('correctly identifies Prisma transient error codes as retryable', () => {
    expect(isTransientDbError({ code: 'P1001' })).toBe(true);
    expect(isTransientDbError({ code: 'P1002' })).toBe(true);
    expect(isTransientDbError({ code: 'P1008' })).toBe(true);
    expect(isTransientDbError({ code: 'P1017' })).toBe(true);
    expect(isTransientDbError({ code: 'P2024' })).toBe(true);
  });

  it('correctly identifies transient connection error messages', () => {
    expect(isTransientDbError(new Error("Can't reach database server at neon.tech:5432"))).toBe(true);
    expect(isTransientDbError(new Error('Connection terminated unexpectedly'))).toBe(true);
    expect(isTransientDbError(new Error('read ECONNRESET'))).toBe(true);
    expect(isTransientDbError(new Error('connect ETIMEDOUT 127.0.0.1:5432'))).toBe(true);
    expect(isTransientDbError(new Error('NeonDbError: compute is spinning up'))).toBe(true);
    expect(isTransientDbError(new Error('server closed the connection'))).toBe(true);
  });

  it('does NOT mark business or schema constraint errors as transient', () => {
    // Unique constraint violation must fail immediately without retry loop
    expect(isTransientDbError({ code: 'P2002', message: 'Unique constraint failed on the fields: (email)' })).toBe(false);
    // Record not found must fail immediately
    expect(isTransientDbError({ code: 'P2025', message: 'An operation failed because it depends on one or more records' })).toBe(false);
    // Foreign key constraint violation
    expect(isTransientDbError({ code: 'P2003', message: 'Foreign key constraint failed' })).toBe(false);
    // Regular validation error
    expect(isTransientDbError(new Error('Invalid input arguments'))).toBe(false);
    expect(isTransientDbError(null)).toBe(false);
    expect(isTransientDbError(undefined)).toBe(false);
  });
});

describe('checkDatabaseHealth Probe', () => {
  it('returns a structured health report with latency and postgresql dialect', async () => {
    const health = await checkDatabaseHealth();
    expect(health).toHaveProperty('ok');
    expect(typeof health.ok).toBe('boolean');
    expect(health).toHaveProperty('latencyMs');
    expect(typeof health.latencyMs).toBe('number');
    expect(health.dialect).toBe('postgresql');
    expect(health).toHaveProperty('timestamp');
  });
});

describe('Database Utility Helpers', () => {
  it('recordAuditLog executes safely without throwing unhandled exceptions', async () => {
    await expect(
      recordAuditLog({
        userId: 'test_user_1',
        action: 'UNIT_TEST_ACTION',
        entity: 'TestEntity',
        entityId: 'id_123',
        metadata: { test: true },
      })
    ).resolves.not.toThrow();
  });
});
