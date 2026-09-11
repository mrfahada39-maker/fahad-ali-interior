import { PrismaClient } from '@prisma/client';
import { validateEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

const SLOW_QUERY_THRESHOLD_MS =
  process.env.NODE_ENV === 'production' ? 200 : 8000;

const MAX_TRANSIENT_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 150;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const envStatus = validateEnv();
const isProd = process.env.NODE_ENV === 'production';
// During `next build`, Next.js may evaluate server route modules.
// We keep production runtime strict, but avoid failing the build phase
// when secrets/integrations are not available in CI.
const isNextBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export';
if (!envStatus.valid && isProd && !isNextBuildPhase) {
  throw new Error(`Invalid environment configuration: ${envStatus.errors.join('; ')}`);
}
if (!envStatus.valid && isProd && isNextBuildPhase) {
  logger.warn('env.invalid_during_build', { errors: envStatus.errors, warnings: envStatus.warnings });
}

const isTestEnv = process.env.NODE_ENV === 'test';
const isBuildOrCI =
  isNextBuildPhase ||
  process.env.SKIP_ENV_VALIDATION === 'true' ||
  process.env.CI === 'true' ||
  isTestEnv;
const databaseUrl =
  process.env.DATABASE_URL ||
  (isBuildOrCI ? 'postgresql://test_mock:test_mock@localhost:5432/test_db' : undefined);
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}
try {
  new URL(databaseUrl);
} catch {
  throw new Error('DATABASE_URL is not a valid URL');
}

/**
 * Detect transient database connection errors (Neon serverless cold starts,
 * pool timeouts, connection resets) that should be automatically retried.
 */
export function isTransientDbError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { code?: string; message?: string; name?: string };

  // Prisma standard connection & transient error codes:
  // P1001: Can't reach database server
  // P1002: Database server was reached but timed out
  // P1008: Operations timed out
  // P1017: Server has closed the connection
  // P2024: Timed out fetching a new connection from the connection pool
  const transientPrismaCodes = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024'];
  if (err.code && transientPrismaCodes.includes(err.code)) {
    return true;
  }

  const message = String(err.message || '').toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes('connection terminated') ||
    message.includes('connection reset') ||
    message.includes('connection closed') ||
    message.includes('server closed the connection') ||
    message.includes('timed out fetching a new connection') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('epipe') ||
    message.includes('neondberror')
  );
}

/**
 * Executes a query with automatic exponential backoff retry for transient connection errors.
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  context: { model?: string; operation: string }
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt < MAX_TRANSIENT_RETRIES && isTransientDbError(err) && !isNextBuildPhase && !isTestEnv) {
        const jitter = Math.floor(Math.random() * 50);
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + jitter;
        logger.warn('db.transient_retry', {
          model: context.model,
          operation: context.operation,
          attempt,
          delayMs: delay,
          error: (err as Error)?.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

function createClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Slow-query extension + Transient connection retry extension
  return client.$extends({
    query: {
      async $allOperations({
        operation,
        model,
        args,
        query,
      }: {
        operation: string;
        model?: string;
        args: any;
        query: (args: any) => Promise<any>;
      }) {
        const start = Date.now();
        try {
          return await executeWithRetry(() => query(args), { model, operation });
        } finally {
          const elapsed = Date.now() - start;
          if (elapsed > SLOW_QUERY_THRESHOLD_MS && !isNextBuildPhase) {
            logger.warn('slow_query', { model, operation, elapsedMs: elapsed });
          }
        }
      },
    },
  }) as unknown as PrismaClient;
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createClient();

globalForPrisma.prisma = db;

/**
 * Probes database connectivity and measures round-trip latency.
 */
export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  latencyMs: number;
  dialect: string;
  error?: string;
  timestamp: string;
}> {
  const start = Date.now();
  try {
    await (db as any).$queryRawUnsafe('SELECT 1 as ping');
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      latencyMs,
      dialect: 'postgresql',
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      dialect: 'postgresql',
      error: err?.message || 'Database ping failed',
      timestamp: new Date().toISOString(),
    };
  }
}
