import crypto from 'crypto';
import { logger } from '@/lib/logger';

export const PRODUCTION_CRITICAL_ENV_VARS = [
  'NEXTAUTH_SECRET',
  'ADMIN_TOKEN_SECRET',
  'TOTP_ENC_KEY',
  'AI_SESSION_SECRET',
  'CRON_SECRET',
  'WHATSAPP_APP_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

export type ProductionCriticalEnvVar = (typeof PRODUCTION_CRITICAL_ENV_VARS)[number];

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
] as const;

const productionRequiredHard = [
  'DIRECT_DATABASE_URL',
  'NEXTAUTH_URL',
] as const;

const productionRecommended = [
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
] as const;

export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return { valid: true, errors: [], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    for (const varName of productionRequiredHard) {
      if (!process.env[varName]) {
        errors.push(`Missing production environment variable: ${varName}`);
      }
    }
    for (const varName of productionRecommended) {
      if (!process.env[varName]) {
        warnings.push(`Recommended production environment variable missing: ${varName}`);
      }
    }

    // ── H3 Production Critical Secrets Enforcement ─────────────────────────────
    // Fail startup if any of the 8 critical secrets are missing, placeholders, or equal to each other
    for (const varName of PRODUCTION_CRITICAL_ENV_VARS) {
      const val = process.env[varName]?.trim();
      if (!val) {
        errors.push(`Missing critical production environment variable: ${varName}`);
        continue;
      }
      if (
        val.startsWith('your-') ||
        val.startsWith('GENERATE_') ||
        val.includes('change-me') ||
        val.includes('placeholder')
      ) {
        errors.push(`${varName} is using an insecure placeholder value in production`);
      }
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
    if (redisUrl && !redisUrl.startsWith('https://')) {
      errors.push('UPSTASH_REDIS_REST_URL must start with https://');
    }

    // Pairwise uniqueness check: No two critical secrets may be identical
    for (let i = 0; i < PRODUCTION_CRITICAL_ENV_VARS.length; i++) {
      for (let j = i + 1; j < PRODUCTION_CRITICAL_ENV_VARS.length; j++) {
        const nameA = PRODUCTION_CRITICAL_ENV_VARS[i];
        const nameB = PRODUCTION_CRITICAL_ENV_VARS[j];
        const valA = process.env[nameA]?.trim();
        const valB = process.env[nameB]?.trim();
        if (valA && valB && valA === valB) {
          errors.push(
            `Secret reuse detected in production: ${nameA} and ${nameB} must not have identical values`
          );
        }
      }
    }

    if (process.env.ALLOW_SEED === 'true') {
      errors.push('ALLOW_SEED must not be enabled in production');
    }
  }

  if (
    (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_PHONE_NUMBER_ID) &&
    !process.env.WHATSAPP_APP_SECRET
  ) {
    warnings.push(
      'WHATSAPP_APP_SECRET is recommended when Meta WhatsApp Cloud API is configured to avoid webhook rejection (401)'
    );
  }

  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (secret) {
    if (secret.length < 32) {
      if (isProduction) {
        errors.push('NEXTAUTH_SECRET must be at least 32 characters in production');
      } else {
        warnings.push('NEXTAUTH_SECRET should be at least 32 characters');
      }
    }
    if (
      secret === 'your-secret-key-change-this-in-production' ||
      secret === 'your-cryptographically-random-32-char-secret-here' ||
      secret === 'change-me'
    ) {
      errors.push('NEXTAUTH_SECRET is using a default placeholder value');
    }
  }

  if (!process.env.SMTP_HOST && isProduction) {
    warnings.push('SMTP not configured — email verification and password reset will not send');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function assertProductionEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === 'true') return;
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export'
  ) {
    return;
  }
  if (process.env.NODE_ENV !== 'production') return;

  const { valid, errors } = validateEnv();
  if (!valid) {
    const msg = `CRITICAL: Production startup aborted due to invalid environment configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}`;
    logger.error(msg);
    throw new Error(msg);
  }
}

export function logEnvStatus(): void {
  const { valid, errors, warnings } = validateEnv();
  if (!valid) {
    logger.error('Environment validation failed:');
    errors.forEach((e) => logger.error(`  - ${e}`));
  }
  if (warnings.length > 0) {
    logger.warn('Environment warnings:');
    warnings.forEach((w) => logger.warn(`  - ${w}`));
  }
}

/**
 * ── Cryptographic Domain-Separated Key Derivation (HKDF-SHA256, RFC 5869) ──────
 * Produces isolated keys for distinct security boundaries without hardcoded fallbacks.
 */
export type DedicatedPurpose =
  | 'admin-token'
  | 'guest-order-token'
  | 'otp-token'
  | 'order-action-token';

let ephemeralDerivationMasterSeed: string | null = null;

function getDerivationMasterMaterial(): string {
  const secret =
    process.env.NEXTAUTH_SECRET?.trim() || process.env.ADMIN_TOKEN_SECRET?.trim();
  if (secret && secret.length >= 16) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL: Master secret material (NEXTAUTH_SECRET/ADMIN_TOKEN_SECRET) is missing in production.'
    );
  }
  if (!ephemeralDerivationMasterSeed) {
    ephemeralDerivationMasterSeed = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralDerivationMasterSeed;
}

export function derivePurposeSecret(
  purpose: DedicatedPurpose,
  dedicatedSecret?: string
): string {
  // 1. Explicit dedicated secret takes precedence if provided with sufficient length
  if (dedicatedSecret && dedicatedSecret.trim().length >= 16) {
    const trimmed = dedicatedSecret.trim();
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXTAUTH_SECRET &&
      trimmed === process.env.NEXTAUTH_SECRET.trim()
    ) {
      throw new Error(`CRITICAL: Dedicated secret for ${purpose} must not equal NEXTAUTH_SECRET.`);
    }
    return trimmed;
  }

  // 2. Cryptographically derive domain-separated key via HKDF-SHA256 (RFC 5869)
  const ikm = getDerivationMasterMaterial();
  const info = `fahad-ali-interior:key-derivation:${purpose}:v1`;
  const salt = Buffer.from(`fai:${purpose}:hkdf-salt:v1`, 'utf8');
  const derived = crypto.hkdfSync('sha256', ikm, salt, info, 32);
  return Buffer.from(derived).toString('hex');
}
