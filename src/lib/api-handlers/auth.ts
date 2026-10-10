import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { encryptTotpSecret, hashBackupCode } from '@/lib/totp-crypto';
import { validatePasswordStrength } from '@/lib/password-policy';
import { adminPasswordChangeSchema } from '@/lib/validations/api-schemas';
import { POST as handleRegister } from '@/app/api/auth/register/route';
import { POST as handleForgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as handleResetPassword } from '@/app/api/auth/reset-password/route';
import { POST as handleVerifyEmail } from '@/app/api/auth/verify-email/route';
import { POST as handleResendVerification } from '@/app/api/auth/resend-verification/route';
import { GET as handleCheck2Fa } from '@/app/api/auth/check-2fa/route';
import { ApiDispatchContext, getUserFromSessionOrToken, requireAdmin } from './shared';

export async function handleAuthRoutes(ctx: ApiDispatchContext): Promise<NextResponse | null> {
  const { method, segment, normalizedSegment, req } = ctx;

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

  if (
    normalizedSegment === 'auth/check-2fa' ||
    normalizedSegment === 'check-2fa' ||
    segment === 'auth/check-2fa' ||
    segment === 'v1/auth/check-2fa' ||
    segment === 'check-2fa'
  ) {
    return handleCheck2Fa(req);
  }

  // 2FA Status, Setup, Enable, Disable
  if (segment.includes('auth/2fa/status')) {
    const user = await getUserFromSessionOrToken(req);
    if (!user) return NextResponse.json({ enabled: false });
    const u = await db.user.findFirst({ where: { id: user.id } }).catch(() => null);
    return NextResponse.json({ enabled: Boolean(u?.totpEnabled) });
  }

  if (segment.includes('auth/2fa/setup')) {
    const user = await getUserFromSessionOrToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const randomSecret = crypto.randomBytes(16).toString('hex').toUpperCase();
    await db.user
      .update({
        where: { id: user.id },
        data: { totpSecret: encryptTotpSecret(randomSecret) },
      })
      .catch(() => {});
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `otpauth://totp/FahadAliInterior:${user.email}?secret=${randomSecret}&issuer=FahadAliInterior`
    )}`;
    return NextResponse.json({ qrCode, manualKey: randomSecret });
  }

  if (segment.includes('auth/2fa/enable')) {
    const user = await getUserFromSessionOrToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    const hashedBackupCodes = backupCodes.map((code) => hashBackupCode(code));
    await db.user
      .update({
        where: { id: user.id },
        data: { totpEnabled: true, backupCodes: hashedBackupCodes },
      })
      .catch(() => {});
    return NextResponse.json({ enabled: true, backupCodes });
  }

  if (segment.includes('auth/2fa/disable')) {
    const user = await getUserFromSessionOrToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await db.user
      .update({
        where: { id: user.id },
        data: { totpEnabled: false, totpSecret: null, backupCodes: [] },
      })
      .catch(() => {});
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
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const admin = await db.user.findFirst({
      where: { role: 'ADMIN', deletedAt: null },
    });
    if (admin) {
      await db.user.update({
        where: { id: admin.id },
        data: {
          name: body.name || admin.name,
          phone: body.phone !== undefined ? body.phone : admin.phone,
        },
      });
    }
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

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }
    const admin = await db.user.findFirst({
      where: { role: 'ADMIN', deletedAt: null },
    });
    if (!admin || !admin.password) {
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
    return NextResponse.json({ success: true, message: 'Admin password updated successfully' });
  }

  return null;
}
