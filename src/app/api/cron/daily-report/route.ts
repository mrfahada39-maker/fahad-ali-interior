import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp';
import { logger } from '@/lib/logger';
import { getVerifiedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Enforce CRON_SECRET verification for Vercel Cron, or Admin Session for manual trigger
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    let isAuthorized = false;

    if (cronSecret && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const tokenBuf = Buffer.from(token);
      const secretBuf = Buffer.from(cronSecret);
      if (tokenBuf.length === secretBuf.length && crypto.timingSafeEqual(tokenBuf, secretBuf)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const admin = await getVerifiedAdmin(req).catch(() => null);
      if (admin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      logger.warn('[Daily Report Cron] Unauthorized invocation attempt rejected');
      return NextResponse.json(
        { error: 'Unauthorized. CRON_SECRET or Admin authentication required.' },
        { status: 401 }
      );
    }

    const success = await WhatsAppService.sendDailyReport();
    logger.info('[Daily Report Cron] Dispatched report:', { success });

    return NextResponse.json({
      success,
      timestamp: new Date().toISOString(),
      message: 'Daily Sales & Stock Report dispatched to Admin WhatsApp',
    });
  } catch (error) {
    logger.error('[Daily Report Cron Error]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to dispatch daily report' },
      { status: 500 }
    );
  }
}
