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
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        logger.warn('[Daily Report Cron] Unauthorized invocation attempt rejected');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const admin = await getVerifiedAdmin(req).catch(() => null);
      if (!admin) {
        return NextResponse.json(
          { error: 'Unauthorized. CRON_SECRET or Admin authentication required.' },
          { status: 401 }
        );
      }
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
