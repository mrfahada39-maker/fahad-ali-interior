import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface CallSession {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail?: string;
  toUserId: string;
  toUserName?: string;
  toUserEmail?: string;
  callType: 'voice' | 'video';
  status: 'outgoing' | 'connected' | 'ended' | 'declined';
  offerSdp?: any;
  answerSdp?: any;
  candidates: any[];
  connectedAt?: number;
  updatedAt: number;
}

// In-memory fallback
const fallbackCallStore = new Map<string, CallSession>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      action,
      fromUserId = 'client',
      toUserId = 'admin',
      fromUserName = 'Valued Client',
      fromUserEmail,
      toUserName,
      toUserEmail,
      callType = 'voice',
      offerSdp,
      answerSdp,
      candidate,
      userAliases = [],
    } = body;

    const now = Date.now();
    const allAliases: string[] = Array.from(
      new Set([fromUserId, fromUserEmail, ...(Array.isArray(userAliases) ? userAliases : [])].filter(Boolean))
    );

    const sessionKey = [fromUserId, toUserId].filter(Boolean).sort().join('_') || fromUserId || 'global_call';

    // 1. Clean up stale call signal records (> 5 minutes)
    try {
      if ((db as any)?.auditLog) {
        await (db as any).auditLog.deleteMany({
          where: {
            entity: 'call_signal',
            createdAt: { lt: new Date(now - 300000) },
          },
        });
      }
    } catch {}

    // ── INITIATE CALL ──────────────────────────────────────────────────────────
    if (action === 'initiate') {
      const session: CallSession = {
        id: sessionKey,
        fromUserId: String(fromUserId || 'client'),
        fromUserName: String(fromUserName || 'Valued Client'),
        fromUserEmail: fromUserEmail ? String(fromUserEmail) : undefined,
        toUserId: String(toUserId || 'admin'),
        toUserName: toUserName ? String(toUserName) : undefined,
        toUserEmail: toUserEmail ? String(toUserEmail) : undefined,
        callType: callType === 'video' ? 'video' : 'voice',
        status: 'outgoing',
        offerSdp: offerSdp || null,
        candidates: [],
        updatedAt: now,
      };

      fallbackCallStore.set(sessionKey, session);

      try {
        if ((db as any)?.auditLog) {
          await (db as any).auditLog.deleteMany({
            where: { entity: 'call_signal', entityId: sessionKey },
          });

          await (db as any).auditLog.create({
            data: {
              action: 'call_initiate',
              entity: 'call_signal',
              entityId: sessionKey,
              metadata: session as any,
            },
          });
        }
      } catch {}

      return NextResponse.json({ success: true, session });
    }

    // ── ACCEPT CALL ────────────────────────────────────────────────────────────
    if (action === 'accept') {
      let session: CallSession | null = null;

      // Find in memory first
      for (const [k, s] of fallbackCallStore.entries()) {
        if (
          k === sessionKey ||
          allAliases.includes(s.toUserId) ||
          allAliases.includes(s.fromUserId) ||
          allAliases.includes(s.toUserEmail || '') ||
          (fromUserId === 'admin' && (s.toUserId === 'admin' || s.fromUserId === 'admin'))
        ) {
          session = s;
          break;
        }
      }

      // Check DB
      try {
        if ((db as any)?.auditLog) {
          const records = await (db as any).auditLog.findMany({
            where: { entity: 'call_signal' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          });

          for (const rec of records) {
            if (rec.metadata) {
              const s = rec.metadata as CallSession;
              if (
                rec.entityId === sessionKey ||
                allAliases.includes(s.toUserId) ||
                allAliases.includes(s.fromUserId) ||
                allAliases.includes(s.toUserEmail || '') ||
                (fromUserId === 'admin' && (s.toUserId === 'admin' || s.fromUserId === 'admin'))
              ) {
                session = s;
                session.status = 'connected';
                session.connectedAt = session.connectedAt || now;
                if (answerSdp) session.answerSdp = answerSdp;
                session.updatedAt = now;

                await (db as any).auditLog.update({
                  where: { id: rec.id },
                  data: { metadata: session as any, action: 'call_accept' },
                });
                break;
              }
            }
          }
        }
      } catch {}

      if (session) {
        session.status = 'connected';
        session.connectedAt = session.connectedAt || now;
        if (answerSdp) session.answerSdp = answerSdp;
        session.updatedAt = now;
        fallbackCallStore.set(session.id || sessionKey, session);
        return NextResponse.json({ success: true, session });
      }

      return NextResponse.json({ success: true, status: 'connected' });
    }

    // ── CANDIDATE EXCHANGE ────────────────────────────────────────────────────
    if (action === 'candidate' && candidate) {
      for (const [k, s] of fallbackCallStore.entries()) {
        if (
          k === sessionKey ||
          allAliases.includes(s.toUserId) ||
          allAliases.includes(s.fromUserId) ||
          (fromUserId === 'admin' && (s.toUserId === 'admin' || s.fromUserId === 'admin'))
        ) {
          s.candidates = s.candidates || [];
          s.candidates.push(candidate);
          s.updatedAt = now;
          break;
        }
      }

      try {
        if ((db as any)?.auditLog) {
          const records = await (db as any).auditLog.findMany({
            where: { entity: 'call_signal' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          });

          for (const rec of records) {
            if (rec.metadata) {
              const s = rec.metadata as CallSession;
              if (
                rec.entityId === sessionKey ||
                allAliases.includes(s.toUserId) ||
                allAliases.includes(s.fromUserId) ||
                (fromUserId === 'admin' && (s.toUserId === 'admin' || s.fromUserId === 'admin'))
              ) {
                s.candidates = s.candidates || [];
                s.candidates.push(candidate);
                s.updatedAt = now;

                await (db as any).auditLog.update({
                  where: { id: rec.id },
                  data: { metadata: s as any },
                });
                break;
              }
            }
          }
        }
      } catch {}

      return NextResponse.json({ success: true });
    }

    // ── END CALL ──────────────────────────────────────────────────────────────
    if (action === 'end' || action === 'decline') {
      for (const [k, s] of fallbackCallStore.entries()) {
        if (
          k === sessionKey ||
          allAliases.includes(s.toUserId) ||
          allAliases.includes(s.fromUserId) ||
          allAliases.includes(s.toUserEmail || '') ||
          (fromUserId === 'admin' && (s.toUserId === 'admin' || s.fromUserId === 'admin'))
        ) {
          s.status = 'ended';
          s.updatedAt = now;
        }
      }

      try {
        if ((db as any)?.auditLog) {
          const records = await (db as any).auditLog.findMany({
            where: { entity: 'call_signal' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          });

          for (const rec of records) {
            if (rec.metadata) {
              const s = rec.metadata as CallSession;
              if (
                rec.entityId === sessionKey ||
                allAliases.includes(s.toUserId) ||
                allAliases.includes(s.fromUserId) ||
                allAliases.includes(s.toUserEmail || '') ||
                (fromUserId === 'admin' && (s.toUserId === 'admin' || s.fromUserId === 'admin'))
              ) {
                s.status = 'ended';
                s.updatedAt = now;
                await (db as any).auditLog.update({
                  where: { id: rec.id },
                  data: { metadata: s as any, action: 'call_end' },
                });
              }
            }
          }
        }
      } catch {}

      return NextResponse.json({ success: true, status: 'ended' });
    }

    // ── STATUS POLLING ────────────────────────────────────────────────────────
    if (action === 'status') {
      let found: CallSession | null = null;

      const prioritySort = (a: CallSession, b: CallSession) => {
        const aActive = a.status === 'outgoing' || a.status === 'connected' ? 1 : 0;
        const bActive = b.status === 'outgoing' || b.status === 'connected' ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      };

      // 1. Check memory store sorted by active status then latest updatedAt
      const memSessions = Array.from(fallbackCallStore.values()).sort(prioritySort);

      for (const s of memSessions) {
        if (fromUserId === 'admin' || allAliases.includes('admin')) {
          if (s.fromUserId === 'admin' || s.toUserId === 'admin') {
            found = s;
            break;
          }
        } else {
          const matches =
            allAliases.includes(s.toUserId) ||
            allAliases.includes(s.toUserEmail || '') ||
            allAliases.includes(s.fromUserId) ||
            allAliases.includes(s.fromUserEmail || '') ||
            s.toUserId === 'client' ||
            s.fromUserId === 'client';
          if (matches) {
            found = s;
            break;
          }
        }
      }

      // 2. Check DB
      if (!found) {
        try {
          if ((db as any)?.auditLog) {
            const records = await (db as any).auditLog.findMany({
              where: { entity: 'call_signal' },
              orderBy: { createdAt: 'desc' },
              take: 10,
            });

            const parsedSessions = records
              .map((r: any) => r.metadata as CallSession)
              .filter(Boolean)
              .sort(prioritySort);

            for (const s of parsedSessions) {
              if (fromUserId === 'admin' || allAliases.includes('admin')) {
                if (s.fromUserId === 'admin' || s.toUserId === 'admin') {
                  found = s;
                  break;
                }
              } else {
                const matches =
                  allAliases.includes(s.toUserId) ||
                  allAliases.includes(s.toUserEmail || '') ||
                  allAliases.includes(s.fromUserId) ||
                  allAliases.includes(s.fromUserEmail || '') ||
                  s.toUserId === 'client' ||
                  s.fromUserId === 'client';
                if (matches) {
                  found = s;
                  break;
                }
              }
            }
          }
        } catch {}
      }

      return NextResponse.json({ session: found || null, success: true });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ session: null, success: true });
  }
}
