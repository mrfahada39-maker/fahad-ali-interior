import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;

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

    const formattedMessages = session.messages.map((m) => {
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
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch chat history' },
      { status: 500 },
    );
  }
}
