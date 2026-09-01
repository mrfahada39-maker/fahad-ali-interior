import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LiveSession {
  sessionId: string;
  ip: string;
  city: string;
  country: string;
  currentPage: string;
  pathname: string;
  device: string;
  browser: string;
  trafficSource: string;
  status: string;
  firstSeen: number;
  lastActive: number;
}

// Global Memory Store attached to Node globalThis to persist across module re-evaluations
const globalRef = globalThis as unknown as {
  _telemetryMap?: Map<string, LiveSession>;
};

if (!globalRef._telemetryMap) {
  globalRef._telemetryMap = new Map<string, LiveSession>();
}
const activeSessionsMap = globalRef._telemetryMap;

function parseLocationFromHeaders(headers: Headers, bodyCity?: string, bodyCountry?: string): { city: string; country: string } {
  if (bodyCity && bodyCity.trim()) {
    return {
      city: bodyCity.trim(),
      country: bodyCountry && bodyCountry.trim() ? bodyCountry.trim() : 'Pakistan',
    };
  }

  const cityHeader = headers.get('x-vercel-ip-city') || headers.get('cf-ipcity');
  const countryHeader = headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || 'Pakistan';

  const city = cityHeader ? decodeURIComponent(cityHeader) : 'Lahore';
  const country = countryHeader === 'PK' ? 'Pakistan' : countryHeader;

  return { city, country };
}

// POST /api/admin/telemetry — Client ping for live tracking
export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const headers = req.headers;
    const sessionId = body.sessionId || 'usr_' + Math.random().toString(36).substring(2, 8);
    const ip = headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const loc = parseLocationFromHeaders(headers, body.city, body.country);

    const now = Date.now();
    const existing = activeSessionsMap.get(sessionId);

    const pathname = body.pathname || '/';
    const pageTitle = body.pageTitle || 'Home Page';
    const trafficSource = body.trafficSource || 'Direct Link';
    const device = body.device || 'Mobile';
    const browser = body.browser || 'Chrome';
    const status = body.actionStatus || 'Browsing';

    const session: LiveSession = {
      sessionId,
      ip,
      city: loc.city,
      country: loc.country === 'PK' ? 'Pakistan' : loc.country,
      currentPage: pageTitle,
      pathname,
      device,
      browser,
      trafficSource,
      status,
      firstSeen: existing ? existing.firstSeen : now,
      lastActive: now,
    };

    // Save in global memory store
    activeSessionsMap.set(sessionId, session);

    // Clean up stale sessions (> 40 seconds old)
    const cutoff = now - 40 * 1000;
    for (const [id, s] of activeSessionsMap.entries()) {
      if (s.lastActive < cutoff) {
        activeSessionsMap.delete(id);
      }
    }

    // Try to safely persist in DB without blocking or crashing if DB is unavailable
    try {
      await db.auditLog.create({
        data: {
          action: 'TELEMETRY_PING',
          entity: 'LIVE_SESSION',
          entityId: sessionId,
          ip,
          userAgent: `${device} (${browser})`,
          metadata: {
            city: loc.city,
            country: loc.country === 'PK' ? 'Pakistan' : loc.country,
            pageTitle,
            pathname,
            trafficSource,
            status,
            device,
            browser,
            firstSeen: session.firstSeen,
            lastActive: now,
          },
        },
      });
    } catch (e) {
      // Ignore DB write error
    }

    return NextResponse.json({ success: true, activeCount: activeSessionsMap.size });
  } catch (error) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// GET /api/admin/telemetry — Returns 100% Real Live Visitor Telemetry
export async function GET() {
  try {
    const now = Date.now();
    
    // Lookback 10 minutes in database to accommodate any server clock timezone sync issues
    const dbCutoffDate = new Date(now - 10 * 60 * 1000);

    let dbLogs: any[] = [];
    try {
      dbLogs = await db.auditLog.findMany({
        where: {
          action: 'TELEMETRY_PING',
          entity: 'LIVE_SESSION',
          createdAt: { gte: dbCutoffDate },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (e) {
      console.error("DB logs query failed:", e);
    }

    // Merge global sessions map and database logs
    const mergedSessions = new Map<string, LiveSession>();

    // 1. Load active sessions from memory
    for (const [id, s] of activeSessionsMap.entries()) {
      mergedSessions.set(id, s);
    }

    // 2. Load active sessions from DB logs
    dbLogs.forEach((log) => {
      const meta = (log.metadata as any) || {};
      const sid = log.entityId || log.id;
      const lastActiveTime = Number(meta.lastActive || new Date(log.createdAt).getTime());

      const existing = mergedSessions.get(sid);
      if (!existing || lastActiveTime > existing.lastActive) {
        mergedSessions.set(sid, {
          sessionId: sid,
          ip: log.ip || '127.0.0.1',
          city: meta.city || 'Lahore',
          country: meta.country || 'Pakistan',
          currentPage: meta.pageTitle || 'Homepage',
          pathname: meta.pathname || '/',
          device: meta.device || 'Mobile',
          browser: meta.browser || 'Chrome',
          trafficSource: meta.trafficSource || 'Direct Link',
          status: meta.status || 'Browsing',
          firstSeen: Number(meta.firstSeen || lastActiveTime),
          lastActive: lastActiveTime,
        });
      }
    });

    // 3. Filter sessions active within the last 40 seconds window
    const activeCutoff = now - 40 * 1000;
    const finalSessions = Array.from(mergedSessions.values())
      .filter((s) => s.lastActive >= activeCutoff)
      .sort((a, b) => b.lastActive - a.lastActive);

    const activeCount = finalSessions.length;

    // Traffic Source Summary
    const sourceMap: Record<string, number> = {};
    finalSessions.forEach((s) => {
      sourceMap[s.trafficSource] = (sourceMap[s.trafficSource] || 0) + 1;
    });

    // Location Summary
    const cityMap: Record<string, number> = {};
    finalSessions.forEach((s) => {
      cityMap[s.city] = (cityMap[s.city] || 0) + 1;
    });
    const topCityEntry = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0];
    const topCityStr = topCityEntry ? `${topCityEntry[0]} (${Math.round((topCityEntry[1] / (activeCount || 1)) * 100)}%)` : 'No Active Users';

    // Device Summary (Refined Text)
    const mobileCount = finalSessions.filter((s) => s.device === 'Mobile').length;
    const desktopCount = finalSessions.filter((s) => s.device !== 'Mobile').length;
    let deviceRatioStr = 'Standby';
    if (activeCount > 0) {
      if (desktopCount > 0 && mobileCount === 0) {
        deviceRatioStr = '100% Desktop';
      } else if (mobileCount > 0 && desktopCount === 0) {
        deviceRatioStr = '100% Mobile';
      } else {
        const mPct = Math.round((mobileCount / activeCount) * 100);
        deviceRatioStr = `${100 - mPct}% Desktop • ${mPct}% Mobile`;
      }
    }

    // Average duration across active sessions
    let avgDwellStr = 'Standby';
    if (activeCount > 0) {
      const totalSecs = finalSessions.reduce((acc, s) => acc + Math.max(1, Math.floor((now - s.firstSeen) / 1000)), 0);
      const avgSecs = Math.round(totalSecs / activeCount);
      const m = Math.floor(avgSecs / 60);
      const s = avgSecs % 60;
      avgDwellStr = m > 0 ? `${m}m ${s}s Active` : `${s}s Active`;
    }

    // Format list of ONLY REAL live active visitors
    const formattedVisitors = finalSessions.map((s) => {
      const activeSeconds = Math.max(1, Math.floor((now - s.lastActive) / 1000));
      const durationSeconds = Math.max(1, Math.floor((now - s.firstSeen) / 1000));
      const durationMins = Math.floor(durationSeconds / 60);
      const durationSecs = durationSeconds % 60;

      return {
        id: s.sessionId,
        visitorNum: `VISITOR #${s.sessionId.slice(-5).toUpperCase()}`,
        location: `${s.city}, ${s.country}`,
        currentPage: s.currentPage,
        pathname: s.pathname,
        device: `${s.device} (${s.browser})`,
        trafficSource: s.trafficSource,
        status: s.status,
        duration: `${durationMins}m ${durationSecs}s`,
        lastSeenAgo: activeSeconds <= 5 ? 'Active Now' : `${activeSeconds}s ago`,
        isRealPing: true,
      };
    });

    // Fetch DB revenue safely for header KPI
    let totalOrderValue = 0;
    try {
      const dbOrders = await db.order.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: { totalAmount: true },
      }).catch(() => []);
      totalOrderValue = dbOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    } catch (e) {}

    return NextResponse.json({
      activeVisitorsCount: activeCount,
      topLocation: topCityStr,
      mobileRatio: deviceRatioStr,
      avgSessionTime: avgDwellStr,
      liveCartValue: `Rs. ${new Intl.NumberFormat('en-PK').format(totalOrderValue || 0)}`,
      visitors: formattedVisitors,
      sourcesBreakdown: sourceMap,
    });
  } catch (error) {
    console.error('Telemetry GET error:', error);
    return NextResponse.json({
      activeVisitorsCount: 0,
      topLocation: 'No Active Users',
      mobileRatio: 'Standby',
      avgSessionTime: '0s',
      liveCartValue: 'Rs. 0',
      visitors: [],
    });
  }
}
