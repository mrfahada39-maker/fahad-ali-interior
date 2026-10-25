import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  createAdminToken,
  getVerifiedUser,
  getVerifiedAdmin,
  revokeAdminTokenAsync,
  revokeAllUserTokensAsync,
} from '@/lib/admin-auth';
import { getUserFromSessionOrToken } from '@/lib/api-handlers/shared';
import { handleAuthRoutes } from '@/lib/api-handlers/auth';
import { GET as getAdminOrders } from '@/app/api/admin/orders/route';
import { db } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/db-utils', () => ({
  recordAuditLog: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: (jest.fn() as any).mockResolvedValue({
    allowed: true,
    remaining: 100,
    resetTime: Date.now() + 60000,
  }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

describe('Admin & Session Token Verification Security Regressions', () => {
  const TEST_ADMIN_SECRET = 'test-canonical-admin-token-secret-minimum-32-chars-long';
  const TEST_NEXTAUTH_SECRET = 'test-nextauth-secret-key-different-secret-32-chars';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_TOKEN_SECRET = TEST_ADMIN_SECRET;
    process.env.NEXTAUTH_SECRET = TEST_NEXTAUTH_SECRET;
  });

  function createAuthContext(
    method: string,
    segment: string,
    tokenOrHeader?: string,
    body?: Record<string, unknown>
  ) {
    const url = `http://localhost:3000/api/v1/${segment}`;
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (tokenOrHeader) {
      if (tokenOrHeader.startsWith('Bearer ') || tokenOrHeader.startsWith('fai_token_')) {
        headers['authorization'] = tokenOrHeader.startsWith('Bearer ')
          ? tokenOrHeader
          : `Bearer ${tokenOrHeader}`;
        headers['cookie'] = `fai_admin_token=${tokenOrHeader.replace(/^Bearer\s+/, '')}`;
      } else {
        headers['cookie'] = tokenOrHeader;
      }
    }

    const req = new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return {
      ctx: {
        method,
        segment,
        normalizedSegment: segment.replace(/^v1\//, ''),
        pathParts: segment.split('/'),
        req,
        ip: '127.0.0.1',
      },
      req,
    };
  }

  // ── 1. Valid token passes ──────────────────────────────────────────────────
  it('Requirement G1: valid HMAC-signed admin token passes verification and grants access', async () => {
    const adminId = 'adm_valid_01';
    const validToken = createAdminToken(adminId);

    (db.user.findUnique as any).mockResolvedValue({
      id: adminId,
      name: 'Fahad Ali Executive',
      email: 'executive@fahadali.pk',
      role: 'ADMIN',
      deletedAt: null,
      lockedUntil: null,
    });

    (db.order.findMany as any).mockResolvedValue([
      {
        id: 'ord_101',
        totalAmount: '450000',
        discount: '0',
        gst: '0',
        subtotal: '450000',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        items: [],
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/admin/orders', {
      headers: { authorization: `Bearer ${validToken}` },
    });

    // 1. Direct verifier passes
    const verifiedAdmin = await getVerifiedAdmin(req);
    expect(verifiedAdmin).not.toBeNull();
    expect(verifiedAdmin?.id).toBe(adminId);
    expect(verifiedAdmin?.role).toBe('ADMIN');

    // 2. /api/admin/* endpoint returns 200
    const ordersRes = await getAdminOrders(req);
    expect(ordersRes.status).toBe(200);
    const ordersData = await ordersRes.json();
    expect(ordersData.success).toBe(true);
    expect(ordersData.orders).toHaveLength(1);

    // 3. /api/v1/* endpoint returns 200
    const { ctx } = createAuthContext('PUT', 'admin/account', validToken, {
      name: 'Fahad Ali Architect',
    });
    const accountRes = await handleAuthRoutes(ctx);
    expect(accountRes).not.toBeNull();
    expect(accountRes?.status).toBe(200);
  });

  // ── 2. Tampered signature fails ───────────────────────────────────────────
  it('Requirement G2: tampered signature fails verification and is rejected with 401', async () => {
    const adminId = 'adm_tamper_02';
    const validToken = createAdminToken(adminId);
    // Tamper the last 8 characters of HMAC hex signature
    const tamperedToken = validToken.slice(0, -8) + 'deadbeef';

    (db.user.findUnique as any).mockResolvedValue({
      id: adminId,
      name: 'Fahad Ali',
      email: 'fahad@fahadali.pk',
      role: 'ADMIN',
      deletedAt: null,
      lockedUntil: null,
    });

    const req = new NextRequest('http://localhost:3000/api/admin/orders', {
      headers: { authorization: `Bearer ${tamperedToken}` },
    });

    const verified = await getVerifiedAdmin(req);
    expect(verified).toBeNull();

    // /api/admin/orders rejects with 403
    const ordersRes = await getAdminOrders(req);
    expect(ordersRes.status).toBe(403);

    // /api/v1/admin/account rejects with 401 Unauthorized
    const { ctx } = createAuthContext('PUT', 'admin/account', tamperedToken, { name: 'Hacker' });
    const accountRes = await handleAuthRoutes(ctx);
    expect(accountRes?.status).toBe(401);
  });

  // ── 3. Expired token fails ────────────────────────────────────────────────
  it('Requirement G3: expired token (> 24 hours) fails verification and is rejected', async () => {
    const adminId = 'adm_expired_03';
    const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
    const expiredToken = createAdminToken(adminId, twentyFiveHoursAgo);

    (db.user.findUnique as any).mockResolvedValue({
      id: adminId,
      role: 'ADMIN',
      deletedAt: null,
      lockedUntil: null,
    });

    const req = new NextRequest('http://localhost:3000/api/admin/orders', {
      headers: { authorization: `Bearer ${expiredToken}` },
    });

    const verified = await getVerifiedAdmin(req);
    expect(verified).toBeNull();

    const ordersRes = await getAdminOrders(req);
    expect(ordersRes.status).toBe(403);

    const { ctx } = createAuthContext('PUT', 'admin/account', expiredToken, { name: 'Late' });
    const accountRes = await handleAuthRoutes(ctx);
    expect(accountRes?.status).toBe(401);
  });

  // ── 4. Revoked fails on BOTH /api/admin/* and /api/v1/* paths ──────────────
  it('Requirement G4: revoked token fails on BOTH /api/admin/* and /api/v1/* paths', async () => {
    const adminId = 'adm_revoked_04';
    const tokenToRevoke = createAdminToken(adminId);

    (db.user.findUnique as any).mockResolvedValue({
      id: adminId,
      role: 'ADMIN',
      deletedAt: null,
      lockedUntil: null,
    });

    // Revoke token via async persistence
    await revokeAdminTokenAsync(tokenToRevoke);

    // Verify on /api/admin/* path
    const reqAdmin = new NextRequest('http://localhost:3000/api/admin/orders', {
      headers: { authorization: `Bearer ${tokenToRevoke}` },
    });
    const verifiedOnAdmin = await getVerifiedAdmin(reqAdmin);
    expect(verifiedOnAdmin).toBeNull();

    const adminOrdersRes = await getAdminOrders(reqAdmin);
    expect(adminOrdersRes.status).toBe(403);

    // Verify on /api/v1/* path
    const { ctx } = createAuthContext('PUT', 'admin/account', tokenToRevoke, { name: 'Revoked' });
    const v1Res = await handleAuthRoutes(ctx);
    expect(v1Res?.status).toBe(401);

    // Also test per-user timestamp revocation
    const secondToken = createAdminToken(adminId);
    await revokeAllUserTokensAsync(adminId);

    const reqAdmin2 = new NextRequest('http://localhost:3000/api/admin/orders', {
      headers: { authorization: `Bearer ${secondToken}` },
    });
    expect(await getVerifiedAdmin(reqAdmin2)).toBeNull();

    const { ctx: ctx2 } = createAuthContext('PUT', 'admin/account', secondToken, { name: 'UserRevoked' });
    const v1Res2 = await handleAuthRoutes(ctx2);
    expect(v1Res2?.status).toBe(401);
  });

  // ── 5. Legacy NEXTAUTH_SECRET-signed token fails ───────────────────────────
  it('Requirement G5: legacy NEXTAUTH_SECRET-signed token and :ADMIN variants fail', async () => {
    const adminId = 'adm_legacy_05';
    const ts = Date.now();

    // 1. Signature minted with NEXTAUTH_SECRET instead of ADMIN_TOKEN_SECRET
    const legacySig = crypto
      .createHmac('sha256', TEST_NEXTAUTH_SECRET)
      .update(`${adminId}:${ts}`)
      .digest('hex');
    const legacyToken = `fai_token_${adminId}_${ts}_${legacySig}`;

    // 2. Legacy :ADMIN suffix payload
    const legacyAdminSuffixSig = crypto
      .createHmac('sha256', TEST_NEXTAUTH_SECRET)
      .update(`${adminId}:ADMIN:${ts}`)
      .digest('hex');
    const legacySuffixToken = `fai_token_${adminId}_${ts}_${legacyAdminSuffixSig}`;

    (db.user.findUnique as any).mockResolvedValue({
      id: adminId,
      role: 'ADMIN',
      deletedAt: null,
      lockedUntil: null,
    });

    const req1 = new NextRequest('http://localhost:3000/api/admin/orders', {
      headers: { authorization: `Bearer ${legacyToken}` },
    });
    expect(await getVerifiedAdmin(req1)).toBeNull();
    expect(await getUserFromSessionOrToken(req1)).toBeNull();

    const { ctx: ctx1 } = createAuthContext('PUT', 'admin/account', legacyToken, { name: 'Legacy' });
    const res1 = await handleAuthRoutes(ctx1);
    expect(res1?.status).toBe(401);

    const req2 = new NextRequest('http://localhost:3000/api/admin/orders', {
      headers: { authorization: `Bearer ${legacySuffixToken}` },
    });
    expect(await getVerifiedAdmin(req2)).toBeNull();
    expect(await getUserFromSessionOrToken(req2)).toBeNull();

    const { ctx: ctx2 } = createAuthContext('PUT', 'admin/account', legacySuffixToken, { name: 'Suffix' });
    const res2 = await handleAuthRoutes(ctx2);
    expect(res2?.status).toBe(401);
  });

  // ── 6. User demoted from ADMIN in DB gets 403 ─────────────────────────────
  it('Requirement G6: user demoted from ADMIN in the DB gets 403 Forbidden', async () => {
    const userId = 'usr_demoted_06';
    const validSignatureToken = createAdminToken(userId);

    // Live DB returns role: 'USER' (client was demoted in DB)
    (db.user.findUnique as any).mockResolvedValue({
      id: userId,
      name: 'Demoted Staff',
      email: 'demoted@fahadali.pk',
      role: 'USER',
      deletedAt: null,
      lockedUntil: null,
    });

    const req = new NextRequest('http://localhost:3000/api/admin/orders', {
      headers: { authorization: `Bearer ${validSignatureToken}` },
    });

    // getVerifiedAdmin returns null because role !== 'ADMIN'
    const verifiedAdmin = await getVerifiedAdmin(req);
    expect(verifiedAdmin).toBeNull();

    // getVerifiedUser succeeds in identifying user, but role is 'USER'
    const verifiedUser = await getVerifiedUser(req);
    expect(verifiedUser).not.toBeNull();
    expect(verifiedUser?.role).toBe('USER');

    // /api/admin/orders returns 403 Forbidden
    const ordersRes = await getAdminOrders(req);
    expect(ordersRes.status).toBe(403);

    // /api/v1/admin/account returns 403 Forbidden (authenticated, but wrong role)
    const { ctx } = createAuthContext('PUT', 'admin/account', validSignatureToken, { name: 'Demoted' });
    const accountRes = await handleAuthRoutes(ctx);
    expect(accountRes?.status).toBe(403);
    const body = await accountRes?.json();
    expect(body.error).toContain('Forbidden');
  });

  // ── 7. Two admins in DB each change only their own password ────────────────
  it('Requirement G7: two admins in the DB each change only their own password and account', async () => {
    const adminAId = 'adm_alpha_07';
    const adminBId = 'adm_beta_07';

    const tokenA = createAdminToken(adminAId);
    const tokenB = createAdminToken(adminBId);

    const hashA = await bcrypt.hash('AlphaCurrentPassword123!', 10);
    const hashB = await bcrypt.hash('BetaCurrentPassword123!', 10);

    const adminRecords: Record<string, any> = {
      [adminAId]: {
        id: adminAId,
        name: 'Admin Alpha',
        email: 'alpha@fahadali.pk',
        role: 'ADMIN',
        password: hashA,
        phone: '+92 300 1111111',
        deletedAt: null,
        lockedUntil: null,
      },
      [adminBId]: {
        id: adminBId,
        name: 'Admin Beta',
        email: 'beta@fahadali.pk',
        role: 'ADMIN',
        password: hashB,
        phone: '+92 300 2222222',
        deletedAt: null,
        lockedUntil: null,
      },
    };

    (db.user.findUnique as any).mockImplementation(async (args: any) => {
      const id = args?.where?.id;
      return adminRecords[id] || null;
    });

    (db.user.update as any).mockImplementation(async (args: any) => {
      const id = args?.where?.id;
      if (adminRecords[id]) {
        adminRecords[id] = { ...adminRecords[id], ...args?.data };
        return adminRecords[id];
      }
      return null;
    });

    // ── Admin A changes their password ──────────────────────────────────────
    const { ctx: ctxA } = createAuthContext('PUT', 'admin/password', tokenA, {
      currentPassword: 'AlphaCurrentPassword123!',
      newPassword: 'AlphaNewPassword456!#',
    });
    const resA = await handleAuthRoutes(ctxA);
    expect(resA?.status).toBe(200);

    // Verify only Admin A was updated
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: adminAId },
      })
    );
    expect(db.user.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: adminBId },
      })
    );

    // Verify Admin B's password remains unchanged
    expect(adminRecords[adminBId].password).toBe(hashB);
    const isBStillOriginal = await bcrypt.compare('BetaCurrentPassword123!', adminRecords[adminBId].password);
    expect(isBStillOriginal).toBe(true);

    // Verify Admin A's password was updated
    const isANewPassword = await bcrypt.compare('AlphaNewPassword456!#', adminRecords[adminAId].password);
    expect(isANewPassword).toBe(true);

    jest.clearAllMocks();

    // ── Admin B changes their password ──────────────────────────────────────
    const { ctx: ctxB } = createAuthContext('PUT', 'admin/password', tokenB, {
      currentPassword: 'BetaCurrentPassword123!',
      newPassword: 'BetaNewPassword789!#',
    });
    const resB = await handleAuthRoutes(ctxB);
    expect(resB?.status).toBe(200);

    // Verify only Admin B was updated
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: adminBId },
      })
    );
    expect(db.user.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: adminAId },
      })
    );

    // Verify Admin B's password was updated
    const isBNewPassword = await bcrypt.compare('BetaNewPassword789!#', adminRecords[adminBId].password);
    expect(isBNewPassword).toBe(true);
  }, 35000);
});
