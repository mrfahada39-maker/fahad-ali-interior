import crypto from 'crypto';

/**
 * TOTP Secret Encryption and Backup Code Hashing Utility
 *
 * Requirements:
 * - Encrypt totpSecret at rest using AES-256-GCM with env TOTP_ENC_KEY.
 * - Hash backup codes using SHA-256 with salt.
 * - Safe migration path: Automatically handles legacy plaintext secrets and unhashed codes.
 */

const CIPHER_ALGO = 'aes-256-gcm';
const PREFIX_SECRET = 'enc:v1:';
const PREFIX_BACKUP = 'bkc:v1:';
const BACKUP_SALT = 'fai_backup_code_salt_v1';

function getEncryptionKey(): Buffer {
  const envKey = process.env.TOTP_ENC_KEY;
  if (envKey && envKey.trim()) {
    // If provided as a 64-char hex string, convert from hex; otherwise sha256 hash to guaranteed 32 bytes
    if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
      return Buffer.from(envKey, 'hex');
    }
    return crypto.createHash('sha256').update(envKey).digest();
  }
  // Safe fallback to NEXTAUTH_SECRET (hashed to 32 bytes) if TOTP_ENC_KEY not explicitly configured
  const fallback = process.env.NEXTAUTH_SECRET || 'fai_default_totp_encryption_key_32bytes_min';
  return crypto.createHash('sha256').update(fallback).digest();
}

/** Encrypts a plaintext TOTP secret with AES-256-GCM. */
export function encryptTotpSecret(plainSecret: string): string {
  if (!plainSecret) return plainSecret;
  if (plainSecret.startsWith(PREFIX_SECRET)) return plainSecret; // Already encrypted

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv(CIPHER_ALGO, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainSecret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX_SECRET}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/** Decrypts an encrypted TOTP secret, or returns legacy plaintext directly (safe migration path). */
export function decryptTotpSecret(storedSecret: string | null | undefined): string | null {
  if (!storedSecret) return null;

  // Safe migration path: legacy unencrypted secrets are returned as-is
  if (!storedSecret.startsWith(PREFIX_SECRET)) {
    return storedSecret;
  }

  try {
    const parts = storedSecret.slice(PREFIX_SECRET.length).split(':');
    if (parts.length !== 3) return storedSecret;

    const [ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(CIPHER_ALGO, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    // If decryption fails, return null or fallback
    return null;
  }
}

/** Hashes a backup code with SHA-256 and salt. */
export function hashBackupCode(code: string): string {
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const hash = crypto.createHash('sha256').update(`${clean}:${BACKUP_SALT}`).digest('hex');
  return `${PREFIX_BACKUP}${hash}`;
}

/**
 * Checks an input backup code against stored codes (supports both hashed and legacy unhashed codes).
 * Returns matched stored string (to remove from user's backupCodes array) or null if invalid.
 */
export function verifyBackupCode(inputCode: string, storedCodes: string[]): string | null {
  if (!inputCode || !Array.isArray(storedCodes) || storedCodes.length === 0) {
    return null;
  }

  const cleanInput = inputCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const expectedHash = hashBackupCode(cleanInput);

  for (const stored of storedCodes) {
    if (stored.startsWith(PREFIX_BACKUP)) {
      if (stored === expectedHash) {
        return stored;
      }
    } else {
      // Safe migration path: legacy plaintext backup code
      const cleanStored = stored.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (cleanStored === cleanInput) {
        return stored;
      }
    }
  }

  return null;
}
