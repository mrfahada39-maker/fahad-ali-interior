import { PrismaClient } from '@prisma/client';
import { validateEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

const SLOW_QUERY_THRESHOLD_MS =
  process.env.NODE_ENV === 'production' ? 200 : 8000;

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

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}
try {
  new URL(databaseUrl);
} catch {
  throw new Error('DATABASE_URL is not a valid URL');
}

function createClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Slow-query extension — logs any query exceeding the threshold.
  return client.$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const start = Date.now();
        try {
          return await query(args);
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
