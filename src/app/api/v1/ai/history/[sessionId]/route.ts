/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getVerifiedAdmin } from '@/lib/admin-auth';
import { AI_SESSION_COOKIE_NAME, verifyAiSessionCookie } from '@/lib/ai-session-binding';

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`ai_history:${ip}`, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const { sessionId } = await context.params;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required.' }, { status: 400 });
    }

    const session = await db.chatSession.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({
        success: true,
        sessionId,
        messages: [],
      });
    }

    // H6: Enforce session binding. Only the session owner or verified admin may view history.
    const admin = await getVerifiedAdmin(request);
    const isOwner = (() => {
      if (admin) return true;

      // Verify signed httpOnly cookie
      const cookieVal = request.cookies.get(AI_SESSION_COOKIE_NAME)?.value;
      const verifiedCookieSession = verifyAiSessionCookie(cookieVal);
      if (verifiedCookieSession && verifiedCookieSession === sessionId) {
        return true;
      }

      return false;
    })();

    if (!isOwner) {
      // Check authenticated user binding
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      const userId = token?.id as string | undefined;
      if (!userId || !session.userId || session.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to access this chat history.' },
          { status: 403 }
        );
      }
    }

    const formattedMessages = session.messages.map((m: any) => {
      const meta = (m.metadata as any) || {};
      return {
        id: m.id,
        sender: m.role === 'user' ? 'user' : 'ai',
        text: m.content,
        products: meta.products,
        quote: meta.quote,
        whatsAppUrl: meta.whatsAppUrl,
        suggestedPrompts: meta.suggestedPrompts,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    });

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      status: session.status,
      messages: formattedMessages,
    });
  } catch (err: any) {
    logger.error('[AI_HISTORY_ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
