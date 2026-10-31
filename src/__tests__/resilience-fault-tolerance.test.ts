import { describe, it, expect } from '@jest/globals';
import { isTransientDbError } from '@/lib/db';
import { safeApiErrorResponse } from '@/lib/api-error';

describe('src/lib/db.ts & src/lib/api-error.ts Real Fault-Tolerance Verification', () => {
  describe('isTransientDbError (Neon Serverless & Prisma Recovery)', () => {
    it('recognizes standard Prisma transient connection error codes', () => {
      expect(isTransientDbError({ code: 'P1001' })).toBe(true); // Can't reach database server
      expect(isTransientDbError({ code: 'P1002' })).toBe(true); // Database server reached but timed out
      expect(isTransientDbError({ code: 'P1008' })).toBe(true); // Operations timed out
      expect(isTransientDbError({ code: 'P1017' })).toBe(true); // Server closed connection
      expect(isTransientDbError({ code: 'P2024' })).toBe(true); // Pool acquisition timed out
    });

    it('recognizes transient connection error messages in Neon / Node.js networks', () => {
      expect(isTransientDbError(new Error("Can't reach database server at neon.tech:5432"))).toBe(true);
      expect(isTransientDbError(new Error('Connection terminated unexpectedly'))).toBe(true);
      expect(isTransientDbError(new Error('read ECONNRESET'))).toBe(true);
      expect(isTransientDbError(new Error('connect ETIMEDOUT'))).toBe(true);
      expect(isTransientDbError(new Error('write EPIPE'))).toBe(true);
      expect(isTransientDbError(new Error('NeonDbError: Connection timed out'))).toBe(true);
    });

    it('returns false for permanent application errors (e.g. constraints, not found, syntax)', () => {
      expect(isTransientDbError({ code: 'P2002' })).toBe(false); // Unique constraint violation
      expect(isTransientDbError({ code: 'P2025' })).toBe(false); // Record not found
      expect(isTransientDbError(new Error('Invalid column name: xyz'))).toBe(false);
      expect(isTransientDbError(null)).toBe(false);
      expect(isTransientDbError(undefined)).toBe(false);
    });
  });

  describe('safeApiErrorResponse (Production Error Shield)', () => {
    it('masks internal stack traces and returns generic error with requestId', async () => {
      const internalDbError = new Error('FATAL: password authentication failed for user "postgres"');
      const response = safeApiErrorResponse(internalDbError, 'Failed to process luxury order', 500);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to process luxury order');
      expect(json.requestId).toBeDefined();
      expect(typeof json.requestId).toBe('string');
      // Must not leak internal database password/credentials
      expect(JSON.stringify(json)).not.toContain('FATAL');
      expect(JSON.stringify(json)).not.toContain('password');
    });

    it('honors custom status codes and request id headers', async () => {
      const mockReq = new Request('https://fahad-ali-interior.com/api/test', {
        headers: { 'x-request-id': 'req-luxury-custom-9988' },
      });
      const response = safeApiErrorResponse(new Error('Service busy'), 'Database busy', 503, mockReq);

      expect(response.status).toBe(503);
      const json = await response.json();
      expect(json.error).toBe('Database busy');
      expect(json.requestId).toBe('req-luxury-custom-9988');
    });
  });
});
