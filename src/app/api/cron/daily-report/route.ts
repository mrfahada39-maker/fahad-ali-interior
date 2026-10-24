import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Optional CRON_SECRET verification for secure Vercel Cron invocation
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('[Daily Report Cron] Invocation without matching CRON_SECRET');
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
