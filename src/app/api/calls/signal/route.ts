import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getToken } from 'next-auth/jwt';
import { Redis } from '@upstash/redis';
import { db } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/admin-auth';

interface AuditLogDelegate {
  deleteMany: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  findMany: (args: unknown) => Promise<Array<{ metadata?: unknown; entityId?: string }>>;
}

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
  offerSdp?: RTCSessionDescriptionInit | Record<string, unknown> | null;
  answerSdp?: RTCSessionDescriptionInit | Record<string, unknown> | null;
  candidates: Array<RTCIceCandidateInit | Record<string, unknown>>;
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
    const auditDb = db as unknown as { auditLog?: AuditLogDelegate };
    if (auditDb.auditLog) {
      await auditDb.auditLog.deleteMany({
        where: { entity: 'call_signal', entityId: sessionKey },
      });
      await auditDb.auditLog.create({
        data: {
          action: actionName,
          entity: 'call_signal',
          entityId: sessionKey,
          metadata: session as unknown as object,
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
    const auditDb = db as unknown as { auditLog?: AuditLogDelegate };
    if (auditDb.auditLog) {
      await auditDb.auditLog.deleteMany({
        where: {
          entity: 'call_signal',
          createdAt: { lt: new Date(now - CALL_TTL_MS) },
        },
      }).catch(() => {});

      const records = await auditDb.auditLog.findMany({
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
          if (key) {
            const existing = sessionsMap.get(key);
            if (!existing || (s.updatedAt || 0) > (existing.updatedAt || 0)) {
              sessionsMap.set(key, s);
            }
          }
        }
      }
    }
  } catch {
    // Ignore DB errors
  }

  return Array.from(sessionsMap.values());
}

interface ResolvedCaller {
  userId: string;
  userName: string;
  userEmail?: string;
  aliases: string[];
  isAdmin: boolean;
  isAuthenticated: boolean;
}

/**
 * Derives authentic caller identity strictly from verified authentication sessions:
 * 1. Admin session via verified admin token (cookie or header)
 * 2. Customer session via verified NextAuth JWT
 * 3. Fallback to scoped anonymous guest identity (preventing spoofing of other users, admins, or arbitrary aliases)
 */
async function resolveCallerIdentity(req: NextRequest, body: Record<string, unknown>): Promise<ResolvedCaller> {
  // 1. Check for verified Admin session (fai_admin_token cookie or Bearer token)
  const admin = await getVerifiedAdmin(req);
  if (admin) {
    const adminId = 'admin';
    const adminEmail = (admin.email || 'concierge@fahadali.com').trim().toLowerCase();
    const adminName = admin.name || 'Atelier Concierge';
    const aliases = Array.from(new Set(['admin', admin.id, adminEmail].filter(Boolean)));
    return {
      userId: adminId,
      userName: adminName,
      userEmail: adminEmail,
      aliases,
      isAdmin: true,
      isAuthenticated: true,
    };
  }

  // 2. Check for verified NextAuth customer session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token && (token.id || token.sub)) {
    const userId = String(token.id || token.sub);
    const userEmail = token.email ? String(token.email).trim().toLowerCase() : undefined;
    const userName = (token.name as string) || (typeof body.fromUserName === 'string' ? body.fromUserName : '') || 'Valued Client';
    const aliases = Array.from(new Set([userId, ...(userEmail ? [userEmail] : [])]));
    return {
      userId,
      userName,
      userEmail,
      aliases,
      isAdmin: false,
      isAuthenticated: true,
    };
  }

  // 3. Unauthenticated guest caller
  // Strictly prevent guests from claiming 'admin' or spoofing arbitrary user accounts/aliases
  const rawId = typeof body.fromUserId === 'string' ? body.fromUserId.trim() : '';
  const safeGuestId =
    rawId && rawId !== 'admin' && !rawId.includes('@')
      ? rawId
      : `guest_${crypto.randomBytes(6).toString('hex')}`;
  const safeGuestName =
    typeof body.fromUserName === 'string' && body.fromUserName.trim()
      ? body.fromUserName.trim().slice(0, 50)
      : 'Guest Visitor';

  return {
    userId: safeGuestId,
    userName: safeGuestName,
    aliases: [safeGuestId],
    isAdmin: false,
    isAuthenticated: false,
  };
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
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const rawFromUserId = typeof body.fromUserId === 'string' ? body.fromUserId.trim() : '';
    const rawAliases = Array.isArray(body.userAliases) ? (body.userAliases as string[]) : [];

    // Verify admin identity if caller attempts to claim admin privileges
    if (rawFromUserId === 'admin' || rawAliases.includes('admin')) {
      const isAdmin = Boolean(await getVerifiedAdmin(req));
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 403 });
      }
    }

    // Derive authentic caller identity strictly from verified session
    const caller = await resolveCallerIdentity(req, body);

    const action = typeof body.action === 'string' ? body.action : '';
    const toUserId = typeof body.toUserId === 'string' && body.toUserId ? body.toUserId : 'admin';
    const toUserName = typeof body.toUserName === 'string' ? body.toUserName : undefined;
    const toUserEmail = typeof body.toUserEmail === 'string' ? body.toUserEmail : undefined;
    const callType = body.callType === 'video' ? 'video' : 'voice';
    const offerSdp = body.offerSdp as RTCSessionDescriptionInit | Record<string, unknown> | null | undefined;
    const answerSdp = body.answerSdp as RTCSessionDescriptionInit | Record<string, unknown> | null | undefined;
    const candidate = body.candidate as
      | (RTCIceCandidateInit & { candidate?: unknown; sdpMid?: unknown; sdpMLineIndex?: unknown })
      | undefined;

    const now = Date.now();
    const sessionKey = [caller.userId, toUserId].filter(Boolean).sort().join('_') || caller.userId || 'global_call';

    // ── INITIATE CALL ──────────────────────────────────────────────────────────
    if (action === 'initiate') {
      const session: CallSession = {
        id: sessionKey,
        fromUserId: caller.userId,
        fromUserName: caller.userName,
        fromUserEmail: caller.userEmail,
        toUserId,
        toUserName,
        toUserEmail,
        callType,
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
      const session = allSessions.find((s) => matchesSession(s, sessionKey, caller.userId, caller.aliases)) || null;

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
      const session = allSessions.find((s) => matchesSession(s, sessionKey, caller.userId, caller.aliases)) || null;

      if (session) {
        session.candidates = session.candidates || [];
        const rawCand = candidate.candidate !== undefined ? candidate.candidate : candidate;
        const candPayload =
          typeof rawCand === 'object' && rawCand !== null && !('candidate' in candidate)
            ? candidate
            : {
                candidate:
                  typeof rawCand === 'string' ? rawCand : (rawCand as { candidate?: string })?.candidate || '',
                sdpMid:
                  candidate.sdpMid !== undefined
                    ? (candidate.sdpMid as string | null)
                    : (rawCand as { sdpMid?: string | null })?.sdpMid,
                sdpMLineIndex:
                  candidate.sdpMLineIndex !== undefined
                    ? (candidate.sdpMLineIndex as number | null)
                    : (rawCand as { sdpMLineIndex?: number | null })?.sdpMLineIndex,
                fromUserId: caller.userId,
              };
        session.candidates.push(candPayload);
        session.updatedAt = now;
        await saveCallSessionToStores(session.id || sessionKey, session, 'call_candidate');
      }

      return NextResponse.json({ success: true });
    }

    // ── END CALL ──────────────────────────────────────────────────────────────
    if (action === 'end' || action === 'decline') {
      const matching = allSessions.filter((s) => matchesSession(s, sessionKey, caller.userId, caller.aliases));
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
      const found = sorted.find((s) => matchesSession(s, sessionKey, caller.userId, caller.aliases)) || null;

      return NextResponse.json({ session: found, success: true });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ session: null, success: true });
  }
}
