/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { db } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/admin-auth';

export interface CallSession {
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

const CALL_TTL_SECONDS = 300; // 5-minute short TTL for serverless WebRTC signaling
const CALL_TTL_MS = CALL_TTL_SECONDS * 1000;

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';
  if (
    url.startsWith('https://') &&
    token.length > 10 &&
    !url.includes('example') &&
    !url.includes('your-db')
  ) {
    if (!redisClient) redisClient = new Redis({ url, token });
    return redisClient;
  }
  return null;
}

function matchesSession(
  s: CallSession,
  sessionKey: string,
  fromUserId: string,
  allAliases: string[]
): boolean {
  if (fromUserId === 'admin' || allAliases.includes('admin')) {
    return s.id === sessionKey || s.fromUserId === 'admin' || s.toUserId === 'admin';
  }
  return (
    s.id === sessionKey ||
    allAliases.includes(s.toUserId) ||
    allAliases.includes(s.toUserEmail || '') ||
    allAliases.includes(s.fromUserId) ||
    allAliases.includes(s.fromUserEmail || '')
  );
}

async function saveCallSessionToStores(sessionKey: string, session: CallSession, actionName: string) {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(`call_session:${sessionKey}`, JSON.stringify(session), { ex: CALL_TTL_SECONDS });
      await redis.sadd('call_sessions:active_keys', sessionKey);
      await redis.expire('call_sessions:active_keys', CALL_TTL_SECONDS);
    } catch {
      // Fall through to DB persistence
    }
  }

  try {
    if ((db as any)?.auditLog) {
      await (db as any).auditLog.deleteMany({
        where: { entity: 'call_signal', entityId: sessionKey },
      });
      await (db as any).auditLog.create({
        data: {
          action: actionName,
          entity: 'call_signal',
          entityId: sessionKey,
          metadata: session as any,
        },
      });
    }
  } catch {
    // Ignore DB errors if auditLog is unavailable in mock tests
  }
}

async function loadActiveCallSessions(now: number): Promise<CallSession[]> {
  const sessionsMap = new Map<string, CallSession>();

  // 1. Read from Upstash Redis (primary low-latency serverless store)
  const redis = getRedis();
  if (redis) {
    try {
      const keys = (await redis.smembers('call_sessions:active_keys')) || [];
      for (const k of keys) {
        const raw = await redis.get(`call_session:${k}`);
        if (raw) {
          const parsed: CallSession = typeof raw === 'string' ? JSON.parse(raw) : (raw as CallSession);
          if (parsed && now - (parsed.updatedAt || 0) < CALL_TTL_MS) {
            sessionsMap.set(parsed.id || k, parsed);
          }
        }
      }
    } catch {
      // Fall through to DB query
    }
  }

  // 2. Read from Database (persistent serverless fallback with 5-minute TTL)
  try {
    if ((db as any)?.auditLog) {
      await (db as any).auditLog.deleteMany({
        where: {
          entity: 'call_signal',
          createdAt: { lt: new Date(now - CALL_TTL_MS) },
        },
      }).catch(() => {});

      const records = await (db as any).auditLog.findMany({
        where: {
          entity: 'call_signal',
          createdAt: { gte: new Date(now - CALL_TTL_MS) },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      });

      for (const rec of records || []) {
        if (rec?.metadata) {
          const s = rec.metadata as CallSession;
          const key = s.id || rec.entityId;
          const existing = sessionsMap.get(key);
          if (!existing || (s.updatedAt || 0) > (existing.updatedAt || 0)) {
            sessionsMap.set(key, s);
          }
        }
      }
    }
  } catch {
    // Ignore DB errors
  }

  return Array.from(sessionsMap.values());
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('target') || '';
  if (target === 'admin') {
    const isAdmin = Boolean(await getVerifiedAdmin(req));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 403 });
    }
  }
  return NextResponse.json({ error: 'Use POST /api/calls/signal with signaling action.' }, { status: 405 });
}

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

    // Verify admin identity if caller claims to be admin
    if (fromUserId === 'admin' || (Array.isArray(userAliases) && userAliases.includes('admin'))) {
      const isAdmin = Boolean(await getVerifiedAdmin(req));
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 403 });
      }
    }

    const now = Date.now();
    const allAliases: string[] = Array.from(
      new Set([fromUserId, fromUserEmail, ...(Array.isArray(userAliases) ? userAliases : [])].filter(Boolean))
    );

    const sessionKey = [fromUserId, toUserId].filter(Boolean).sort().join('_') || fromUserId || 'global_call';

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

      await saveCallSessionToStores(sessionKey, session, 'call_initiate');
      return NextResponse.json({ success: true, session });
    }

    const allSessions = await loadActiveCallSessions(now);

    // ── ACCEPT CALL ────────────────────────────────────────────────────────────
    if (action === 'accept') {
      const session = allSessions.find((s) => matchesSession(s, sessionKey, fromUserId, allAliases)) || null;

      if (session) {
        session.status = 'connected';
        session.connectedAt = session.connectedAt || now;
        if (answerSdp) session.answerSdp = answerSdp;
        session.updatedAt = now;
        await saveCallSessionToStores(session.id || sessionKey, session, 'call_accept');
        return NextResponse.json({ success: true, session });
      }

      return NextResponse.json({ success: true, status: 'connected', session: null });
    }

    // ── CANDIDATE EXCHANGE ────────────────────────────────────────────────────
    if (action === 'candidate' && candidate) {
      const session = allSessions.find((s) => matchesSession(s, sessionKey, fromUserId, allAliases)) || null;

      if (session) {
        session.candidates = session.candidates || [];
        const rawCand = candidate.candidate !== undefined ? candidate.candidate : candidate;
        const candPayload =
          typeof rawCand === 'object' && rawCand !== null && !('candidate' in candidate)
            ? candidate
            : {
                candidate: typeof rawCand === 'string' ? rawCand : rawCand?.candidate || '',
                sdpMid: candidate.sdpMid !== undefined ? candidate.sdpMid : rawCand?.sdpMid,
                sdpMLineIndex:
                  candidate.sdpMLineIndex !== undefined ? candidate.sdpMLineIndex : rawCand?.sdpMLineIndex,
                fromUserId: fromUserId || 'client',
              };
        session.candidates.push(candPayload);
        session.updatedAt = now;
        await saveCallSessionToStores(session.id || sessionKey, session, 'call_candidate');
      }

      return NextResponse.json({ success: true });
    }

    // ── END CALL ──────────────────────────────────────────────────────────────
    if (action === 'end' || action === 'decline') {
      const matching = allSessions.filter((s) => matchesSession(s, sessionKey, fromUserId, allAliases));
      for (const s of matching) {
        s.status = 'ended';
        s.updatedAt = now;
        await saveCallSessionToStores(s.id || sessionKey, s, 'call_end');
      }
      return NextResponse.json({ success: true, status: 'ended' });
    }

    // ── STATUS POLLING ────────────────────────────────────────────────────────
    if (action === 'status') {
      const prioritySort = (a: CallSession, b: CallSession) => {
        const aActive = a.status === 'outgoing' || a.status === 'connected' ? 1 : 0;
        const bActive = b.status === 'outgoing' || b.status === 'connected' ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      };

      const isLiveOrRecent = (s: CallSession) => {
        if (s.status === 'outgoing' || s.status === 'connected') return true;
        return now - (s.updatedAt || 0) < 15000;
      };

      const sorted = allSessions.filter(isLiveOrRecent).sort(prioritySort);
      const found = sorted.find((s) => matchesSession(s, sessionKey, fromUserId, allAliases)) || null;

      return NextResponse.json({ session: found, success: true });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ session: null, success: true });
  }
}
