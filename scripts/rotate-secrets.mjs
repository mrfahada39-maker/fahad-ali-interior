/**
 * Secret Rotation Tool
 * Run: node scripts/rotate-secrets.mjs
 * Generates cryptographically secure secrets and prints them.
 * Usage: node scripts/rotate-secrets.mjs >> .env.rotated
 */
import { randomBytes, createHash } from 'crypto';

function generateHexSecret(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

function generateBase64Secret(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

const secrets = {
  JWT_ACCESS_SECRET: generateHexSecret(),
  JWT_REFRESH_SECRET: generateHexSecret(),
  CSRF_SECRET: generateHexSecret(),
  INTERNAL_PROXY_KEY: generateHexSecret(),
  SESSION_SECRET: generateHexSecret(),
  NEXTAUTH_SECRET: generateHexSecret(),
  TOTP_ENCRYPTION_KEY: generateHexSecret(),
  PAYMENT_WEBHOOK_SECRET: generateHexSecret(),
  VAPID_PRIVATE_KEY: generateBase64Secret(32),
};

console.log('# ════════════════════════════════════════════');
console.log(`# Generated: ${new Date().toISOString()}`);
console.log('# ════════════════════════════════════════════');
console.log('# Copy these into your .env / BACKEND/.env files');
console.log('# Then run: npm run db:migrate');
console.log('');

for (const [key, value] of Object.entries(secrets)) {
  console.log(`${key}=${value}`);
}

console.log('');
console.log('# 🔴 IMPORTANT: Rotate ALL database passwords separately');
console.log('# 🔴 IMPORTANT: Update CLIENT_ID / CLIENT_SECRET for OAuth providers');
console.log('# 🔴 IMPORTANT: Update payment gateway credentials (JazzCash, Easypaisa)');
console.log('# 🔴 IMPORTANT: Regenerate VAPID keys for web push notifications');
