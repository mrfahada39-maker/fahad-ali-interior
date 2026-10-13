import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import {
  decryptTotpSecret,
  encryptTotpSecret,
  hashBackupCode,
  verifyBackupCode,
} from '@/lib/totp-crypto';
import { rateLimit } from '@/lib/rate-limit';
import { recordAuditLog } from '@/lib/db-utils';
import { validatePasswordStrength } from '@/lib/password-policy';
import {
  adminPasswordChangeSchema,
  enable2FaSchema,
  disable2FaSchema,
} from '@/lib/validations/api-schemas';
import { POST as handleRegister } from '@/app/api/auth/register/route';
import { POST as handleForgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as handleResetPassword } from '@/app/api/auth/reset-password/route';
import { POST as handleVerifyEmail } from '@/app/api/auth/verify-email/route';
import { POST as handleResendVerification } from '@/app/api/auth/resend-verification/route';
import { revokeAllUserTokensAsync } from '@/lib/admin-auth';
import { ApiDispatchContext, getUserFromSessionOrToken, requireAdmin } from './shared';

export async function handleAuthRoutes(ctx: ApiDispatchContext): Promise<NextResponse | null> {
  const { method, segment, normalizedSegment, req, ip } = ctx;

  // Delegate canonical auth routes so each exists in one place
  if (
    method === 'POST' &&
    (normalizedSegment === 'auth/forgot-password' ||
      segment === 'auth/forgot-password' ||
      segment === 'v1/auth/forgot-password')
  ) {
    return handleForgotPassword(req);
  }

  if (
    method === 'POST' &&
    (normalizedSegment === 'auth/reset-password' ||
      segment === 'auth/reset-password' ||
      segment === 'v1/auth/reset-password')
  ) {
    return handleResetPassword(req);
  }

  if (
    method === 'POST' &&
    (normalizedSegment === 'auth/verify-email' ||
      segment === 'auth/verify-email' ||
      segment === 'v1/auth/verify-email')
  ) {
    return handleVerifyEmail(req);
  }

  if (
    method === 'POST' &&
    (normalizedSegment === 'auth/resend-verification' ||
      segment === 'auth/resend-verification' ||
      segment === 'v1/auth/resend-verification')
  ) {
    return handleResendVerification(req);
  }

  if (
    method === 'POST' &&
    (normalizedSegment === 'auth/register' ||
      normalizedSegment === 'register' ||
      segment === 'auth/register' ||
      segment === 'v1/auth/register' ||
      segment === 'register' ||
      segment === 'v1/register')
  ) {
    return handleRegister(req);
  }

  // 2FA Status, Setup, Enable, Disable
  const is2faStatus =
    normalizedSegment === 'auth/2fa/status' ||
    segment === 'auth/2fa/status' ||
    segment === 'v1/auth/2fa/status';

  const is2faSetup =
    normalizedSegment === 'auth/2fa/setup' ||
    segment === 'auth/2fa/setup' ||
    segment === 'v1/auth/2fa/setup';

  const is2faEnable =
    normalizedSegment === 'auth/2fa/enable' ||
    segment === 'auth/2fa/enable' ||
    segment === 'v1/auth/2fa/enable';

  const is2faDisable =
    normalizedSegment === 'auth/2fa/disable' ||
    segment === 'auth/2fa/disable' ||
    segment === 'v1/auth/2fa/disable';

  if (is2faStatus) {
    if (method !== 'GET') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) return NextResponse.json({ enabled: false });
    const u = await db.user.findUnique({
      where: { id: user.id },
      select: { totpEnabled: true },
    }).catch(() => null);
    return NextResponse.json({ enabled: Boolean(u?.totpEnabled) });
  }

  if (is2faSetup) {
    if (method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rl = await rateLimit(`2fa_setup:${user.id || ip}`, 'login');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error || 'Too many requests. Please wait a minute and try again.' },
        { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
      );
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, totpEnabled: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (dbUser.totpEnabled) {
      return NextResponse.json({ error: '2FA is already enabled' }, { status: 409 });
    }

    const secret = generateSecret();
    const otpauthUri = generateURI({
      secret,
      label: dbUser.email,
      issuer: 'Fahad Ali Interior',
    });
    const qrCode = await QRCode.toDataURL(otpauthUri);

    await db.user.update({
      where: { id: dbUser.id },
      data: {
        totpSecret: encryptTotpSecret(secret),
        totpEnabled: false,
      },
    });

    return NextResponse.json({ qrCode, manualKey: secret });
  }

  if (is2faEnable) {
    if (method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rl = await rateLimit(`2fa_enable:${user.id || ip}`, 'login');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error || 'Too many attempts. Please wait a minute and try again.' },
        { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = enable2FaSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'A 6-digit verification code is required' },
        { status: 400 }
      );
    }
    const { token } = parsed.data;

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, totpSecret: true, totpEnabled: true },
    });
    if (!dbUser || !dbUser.totpSecret) {
      return NextResponse.json({ error: '2FA setup must be initiated first' }, { status: 400 });
    }

    const plainSecret = decryptTotpSecret(dbUser.totpSecret);
    if (!plainSecret) {
      return NextResponse.json({ error: 'Invalid 2FA secret' }, { status: 400 });
    }

    let isValid = false;
    try {
      const check = verifySync({ token, secret: plainSecret, epochTolerance: 30 });
      isValid = Boolean(check && check.valid);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    const hashedBackupCodes = backupCodes.map((code) => hashBackupCode(code));

    await db.user.update({
      where: { id: dbUser.id },
      data: {
        totpEnabled: true,
        backupCodes: hashedBackupCodes,
      },
    });

    await revokeAllUserTokensAsync(dbUser.id);

    return NextResponse.json({ enabled: true, backupCodes });
  }

  if (is2faDisable) {
    if (method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rl = await rateLimit(`2fa_disable:${user.id || ip}`, 'login');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error || 'Too many attempts. Please wait a minute and try again.' },
        { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = disable2FaSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Current password and 2FA code are required' },
        { status: 400 }
      );
    }
    const { password, token } = parsed.data;

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        password: true,
        totpSecret: true,
        totpEnabled: true,
        backupCodes: true,
      },
    });
    if (!dbUser || !dbUser.totpEnabled) {
      return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 });
    }
    if (!dbUser.password) {
      return NextResponse.json(
        { error: 'Account password required to disable 2FA' },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, dbUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    let codeValid = false;
    const matchedBackup = verifyBackupCode(token, dbUser.backupCodes || []);
    if (matchedBackup) {
      codeValid = true;
    } else if (dbUser.totpSecret) {
      const plainSecret = decryptTotpSecret(dbUser.totpSecret);
      if (plainSecret) {
        try {
          const check = verifySync({ token, secret: plainSecret, epochTolerance: 30 });
          codeValid = Boolean(check && check.valid);
        } catch {
          codeValid = false;
        }
      }
    }

    if (!codeValid) {
      return NextResponse.json({ error: 'Invalid 2FA code or backup code' }, { status: 400 });
    }

    await db.user.update({
      where: { id: dbUser.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        backupCodes: [],
      },
    });

    await revokeAllUserTokensAsync(dbUser.id);

    await recordAuditLog({
      userId: dbUser.id,
      action: '2FA_DISABLED',
      entity: 'User',
      entityId: dbUser.id,
      ip,
      userAgent: req.headers.get('user-agent'),
      metadata: {
        email: dbUser.email,
        disabledAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ disabled: true });
  }

  // PUT / POST /admin/account
  if (
    (method === 'PUT' || method === 'POST') &&
    (normalizedSegment === 'admin/account' ||
      segment === 'admin/account' ||
      segment === 'v1/admin/account')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const admin = await db.user.findUnique({
      where: { id: user.id },
    });
    if (!admin || admin.deletedAt) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }
    await db.user.update({
      where: { id: admin.id },
      data: {
        name: body.name || admin.name,
        phone: body.phone !== undefined ? body.phone : admin.phone,
      },
    });
    return NextResponse.json({ success: true, message: 'Admin account updated successfully' });
  }

  // PUT / POST /admin/password
  if (
    (method === 'PUT' || method === 'POST') &&
    (normalizedSegment === 'admin/password' ||
      segment === 'admin/password' ||
      segment === 'v1/admin/password')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const rawBody = await req.json().catch(() => ({}));
    const parsed = adminPasswordChangeSchema.safeParse(rawBody);
    const currentPassword = parsed.success ? parsed.data.currentPassword : rawBody.currentPassword;
    const newPassword = parsed.success ? parsed.data.newPassword : rawBody.newPassword;

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }
    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }
    const admin = await db.user.findUnique({
      where: { id: user.id },
    });
    if (!admin || !admin.password || admin.deletedAt) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }
    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: admin.id },
      data: { password: hashed },
    });
    await revokeAllUserTokensAsync(admin.id);
    return NextResponse.json({ success: true, message: 'Admin password updated successfully' });
  }

  return null;
}
