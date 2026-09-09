import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const uptimeSeconds = Math.floor(process.uptime());
  const memUsage = process.memoryUsage();
  const memoryUsageMb = Math.round(memUsage.rss / 1024 / 1024);

  const isHealthy = dbHealth.ok;
  const statusCode = isHealthy ? 200 : 503;

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    services: {
      database: {
        status: dbHealth.ok ? 'connected' : 'disconnected',
        dialect: dbHealth.dialect,
        latencyMs: dbHealth.latencyMs,
        ...(dbHealth.error ? { error: dbHealth.error } : {}),
      },
    },
    system: {
      nodeEnv: process.env.NODE_ENV || 'production',
      memoryUsageMb,
    },
  };

  return NextResponse.json(payload, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'X-Health-Status': isHealthy ? 'PASS' : 'FAIL',
    },
  });
}
