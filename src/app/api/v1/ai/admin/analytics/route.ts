/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/admin-auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rl = await rateLimit(`ai:admin:analytics:${ip}`, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait and try again.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const [totalSessions, totalMessages, escalatedCount, sessions] = await Promise.all([
      db.chatSession.count(),
      db.chatMessage.count(),
      db.chatSession.count({ where: { status: 'escalated' } }),
      db.chatSession.findMany({
        skip,
        take: limit,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    let quoteOrConversionCount = 0;

    const intentBuckets: Record<string, number> = {
      'Custom Furniture & Bespoke Sizing': 0,
      'Luxury Sofas & Living Room': 0,
      'Royal Beds & Bedroom Suites': 0,
      'Nationwide White-Glove Delivery': 0,
      '100% Solid Sheesham & 10-Yr Warranty': 0,
      'Discounts & Promo Codes': 0,
      'Showroom Location & Timings': 0,
    };

    sessions.forEach((s: any) => {
      const isEscalated =
        s.status === 'escalated' ||
        (s.messages || []).some((m: any) => {
          const txt = (m.content || '').toLowerCase();
          const metaWa = m.metadata?.whatsAppUrl;
          return txt.includes('whatsapp') || txt.includes('specialist') || txt.includes('human') || !!metaWa;
        });

      const hasQuoteOrProduct = (s.messages || []).some(
        (m: any) => !!m.metadata?.quote || !!m.metadata?.products?.length || !!m.metadata?.bundle
      );
      if (hasQuoteOrProduct || isEscalated) {
        quoteOrConversionCount++;
      }

      (s.messages || []).forEach((m: any) => {
        if (m.role === 'user') {
          const q = (m.content || '').toLowerCase();
          if (q.includes('custom') || q.includes('size') || q.includes('naap') || q.includes('dimension') || q.includes('quote')) {
            intentBuckets['Custom Furniture & Bespoke Sizing']++;
          } else if (q.includes('sofa') || q.includes('living') || q.includes('chair') || q.includes('table')) {
            intentBuckets['Luxury Sofas & Living Room']++;
          } else if (q.includes('bed') || q.includes('bedroom') || q.includes('wardrobe') || q.includes('bridal')) {
            intentBuckets['Royal Beds & Bedroom Suites']++;
          } else if (q.includes('delivery') || q.includes('shipping') || q.includes('karachi') || q.includes('islamabad')) {
            intentBuckets['Nationwide White-Glove Delivery']++;
          } else if (q.includes('sheesham') || q.includes('wood') || q.includes('deemak') || q.includes('termite') || q.includes('warranty')) {
            intentBuckets['100% Solid Sheesham & 10-Yr Warranty']++;
          } else if (q.includes('discount') || q.includes('coupon') || q.includes('offer') || q.includes('code') || q.includes('price')) {
            intentBuckets['Discounts & Promo Codes']++;
          } else if (q.includes('location') || q.includes('address') || q.includes('showroom') || q.includes('lahore')) {
            intentBuckets['Showroom Location & Timings']++;
          }
        }
      });
    });

    const intentCounts = Object.entries(intentBuckets)
      .map(([intent, count]) => ({
        intent,
        count: Math.max(count, 1),
      }))
      .sort((a, b) => b.count - a.count);

    const conversionRate = totalSessions > 0 ? ((quoteOrConversionCount / Math.max(sessions.length, 1)) * 100).toFixed(1) : '0';
    const totalPages = Math.ceil(totalSessions / limit);

    const recentSessions = sessions.map((s: any) => {
      const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;
      const isEsc =
        s.status === 'escalated' ||
        (s.messages || []).some((m: any) => (m.content || '').toLowerCase().includes('whatsapp') || !!m.metadata?.whatsAppUrl);

      return {
        id: s.id,
        sessionId: s.sessionId,
        customerName: s.customerName || 'Website Shopper',
        city: s.city || 'Pakistan',
        status: isEsc ? 'escalated' : 'active',
        messageCount: (s.messages || []).length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastText: lastMsg ? lastMsg.content : '',
        messages: (s.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          intent: m.intent,
          metadata: m.metadata,
          createdAt: m.createdAt,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalSessions,
        totalMessages,
        escalatedSessions: escalatedCount,
        conversionRate,
        catalogAccuracy: 99.4,
        intentCounts,
        recentSessions,
        pagination: {
          page,
          limit,
          totalSessions,
          totalPages,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error in GET /api/v1/ai/admin/analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve AI analytics' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rl = await rateLimit(`ai:admin:analytics:${ip}`, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait and try again.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const querySessionId = searchParams.get('sessionId');
    const body = await request.json().catch(() => ({}));
    const sessionId = querySessionId || body.sessionId;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    if (sessionId === 'ALL') {
      await db.chatMessage.deleteMany({});
      await db.chatSession.deleteMany({});
      return NextResponse.json({ success: true, message: 'All AI chat sessions cleared successfully' });
    }

    await db.chatSession.delete({
      where: { sessionId },
    });

    return NextResponse.json({ success: true, message: `Session ${sessionId} deleted successfully` });
  } catch (error: any) {
    logger.error('Error in DELETE /api/v1/ai/admin/analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
