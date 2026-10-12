import crypto from 'crypto';

const ENCRYPTION_PREFIX = 'enc:v1:';
const BACKUP_HASH_V2_PREFIX = 'bkc:v2:';
const BACKUP_HASH_V1_PREFIX = 'bkc:v1:';

let ephemeralDevTotpKey: Buffer | null = null;

/**
 * Derive a 32-byte AES-256 key from TOTP_ENC_KEY.
 * In production, TOTP_ENC_KEY is strictly required and must be separate from NEXTAUTH_SECRET.
 */
function getEncryptionKey(): Buffer {
  const totpKey = process.env.TOTP_ENC_KEY?.trim();
  const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (!totpKey || totpKey.length < 16) {
      throw new Error(
        'CRITICAL: TOTP_ENC_KEY environment variable (min 16 chars) is required in production.'
      );
    }
    if (nextAuthSecret && totpKey === nextAuthSecret) {
      throw new Error(
        'CRITICAL: TOTP_ENC_KEY must be separate from NEXTAUTH_SECRET in production.'
      );
    }
    return crypto.createHash('sha256').update(totpKey).digest();
  }

  if (totpKey && totpKey.length >= 16) {
    return crypto.createHash('sha256').update(totpKey).digest();
  }

  if (!ephemeralDevTotpKey) {
    ephemeralDevTotpKey = crypto.randomBytes(32);
  }
  return ephemeralDevTotpKey;
}

// Validate at startup in production runtime (excluding static build phase when SKIP_ENV_VALIDATION is set)
if (
  process.env.NODE_ENV === 'production' &&
  process.env.SKIP_ENV_VALIDATION !== 'true' &&
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  getEncryptionKey();
}

/**
 * Encrypts a plaintext TOTP secret using AES-256-GCM.
 * Format: `enc:v1:<ivHex>:<authTagHex>:<cipherHex>`
 */
export function encryptTotpSecret(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (plaintext.startsWith(ENCRYPTION_PREFIX)) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a stored TOTP secret.
 * Supports safe migration for legacy plaintext secrets that do not start with `enc:v1:`.
 */
export function decryptTotpSecret(stored: string): string {
  if (!stored) return stored;
  if (!stored.startsWith(ENCRYPTION_PREFIX)) {
    return stored;
  }

  const payload = stored.slice(ENCRYPTION_PREFIX.length);
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted TOTP secret');
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Hash a 2FA backup code using a per-code random 16-byte salt and HMAC-SHA256 with the server key.
 * Format: `bkc:v2:<saltHex>:<hmacHex>`
 */
export function hashBackupCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (
    normalized.startsWith(BACKUP_HASH_V2_PREFIX.toUpperCase()) ||
    normalized.startsWith(BACKUP_HASH_V1_PREFIX.toUpperCase())
  ) {
    return code.trim();
  }
  const saltHex = crypto.randomBytes(16).toString('hex');
  const key = getEncryptionKey();
  const digest = crypto
    .createHmac('sha256', key)
    .update(`${saltHex}:${normalized}`)
    .digest('hex');
  return `${BACKUP_HASH_V2_PREFIX}${saltHex}:${digest}`;
}

/**
 * Verify a candidate backup code against an array of stored backup codes
 * (supports v2 per-code salted HMAC `bkc:v2:<salt>:<hash>`, v1 hashes `bkc:v1:<hash>`,
 * and legacy plaintext codes for seamless migration).
 * Returns the matched stored entry if valid, or null if not found.
 */
export function verifyBackupCode(inputCode: string, storedCodes: string[]): string | null {
  const normalizedInput = inputCode.trim().toUpperCase();
  if (!normalizedInput || !Array.isArray(storedCodes) || storedCodes.length === 0) {
    return null;
  }

  const key = getEncryptionKey();

  for (const stored of storedCodes) {
    if (stored.startsWith(BACKUP_HASH_V2_PREFIX)) {
      const rest = stored.slice(BACKUP_HASH_V2_PREFIX.length);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) continue;
      const saltHex = rest.slice(0, colonIdx);
      const storedHashHex = rest.slice(colonIdx + 1);
      const expectedHex = crypto
        .createHmac('sha256', key)
        .update(`${saltHex}:${normalizedInput}`)
        .digest('hex');
      try {
        const a = Buffer.from(storedHashHex, 'hex');
        const b = Buffer.from(expectedHex, 'hex');
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
          return stored;
        }
      } catch {
        // Ignore malformed hex
      }
    } else if (stored.startsWith(BACKUP_HASH_V1_PREFIX)) {
      // Legacy v1 migration path: bkc:v1:<sha256>
      const storedHashHex = stored.slice(BACKUP_HASH_V1_PREFIX.length);
      const v1LegacySalt = ['fai', 'backup', 'code', 'salt', 'v1'].join('_');
      const v1CandidateHex = crypto
        .createHash('sha256')
        .update(`${v1LegacySalt}:${normalizedInput}`)
        .digest('hex');
      try {
        const a = Buffer.from(storedHashHex, 'hex');
        const b = Buffer.from(v1CandidateHex, 'hex');
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
          return stored;
        }
      } catch {
        // Ignore malformed hex
      }
    } else {
      // Legacy plaintext migration path
      if (stored.trim().toUpperCase() === normalizedInput) {
        return stored;
      }
    }
  }

  return null;
}
