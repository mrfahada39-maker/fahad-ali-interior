const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'INTERNAL_PROXY_KEY',
] as const;

const productionRequiredHard = [
  'DIRECT_DATABASE_URL',
  'NEXTAUTH_URL',
  'ENTERPRISE_API_ORIGIN',
] as const;

const productionRecommended = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
] as const;

export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  const localProduction =
    process.env.NEXTAUTH_URL?.includes('localhost') ||
    process.env.NEXTAUTH_URL?.includes('127.0.0.1');

  if (process.env.NODE_ENV === 'production' && !localProduction) {
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
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED === 'true') {
    errors.push('ALLOW_SEED must not be enabled in production');
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length < 32) {
    warnings.push('NEXTAUTH_SECRET should be at least 32 characters');
  }
  if (
    secret === 'your-secret-key-change-this-in-production' ||
    secret === 'your-cryptographically-random-32-char-secret-here' ||
    secret === 'change-me'
  ) {
    errors.push('NEXTAUTH_SECRET is using a default placeholder value');
  }

  if (!process.env.SMTP_HOST && process.env.NODE_ENV === 'production') {
    warnings.push('SMTP not configured — email verification and password reset will not send');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function logEnvStatus(): void {
  const { valid, errors, warnings } = validateEnv();
  if (!valid) {
    console.error('Environment validation failed:');
    errors.forEach((e) => console.error(`  - ${e}`));
  }
  if (warnings.length > 0) {
    console.warn('Environment warnings:');
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }
}
