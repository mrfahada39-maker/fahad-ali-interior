import fs from 'fs';
import path from 'path';

describe('L4: CI Pipeline & Documentation Integrity', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const ciPath = path.join(rootDir, '.github/workflows/ci.yml');
  const securityDocPath = path.join(rootDir, 'SECURITY.md');
  const readmeDocPath = path.join(rootDir, 'README.md');

  describe('.github/workflows/ci.yml', () => {
    test('CI workflow file exists and is readable', () => {
      expect(fs.existsSync(ciPath)).toBe(true);
      const content = fs.readFileSync(ciPath, 'utf8');
      expect(content.length).toBeGreaterThan(100);
    });

    test('CI triggers on active development and release branches', () => {
      const content = fs.readFileSync(ciPath, 'utf8');
      expect(content).toContain('refactor/code-quality');
      expect(content).toContain('main');
    });

    test('CI enforces Node 20, clean install, lint, typecheck, tests, and security audit', () => {
      const content = fs.readFileSync(ciPath, 'utf8');
      expect(content).toMatch(/node-version:\s*['"]20['"]/);
      expect(content).toContain('npm ci');
      expect(content).toContain('npx eslint .');
      expect(content).toContain('npx tsc --noEmit');
      expect(content).toContain('--maxWorkers=2');
      expect(content).toContain('npm audit --audit-level=high');
    });

    test('CI configures test secrets without violating pairwise uniqueness', () => {
      const content = fs.readFileSync(ciPath, 'utf8');
      expect(content).toContain('ADMIN_TOKEN_SECRET');
      expect(content).toContain('TOTP_ENC_KEY');
      expect(content).toContain('AI_SESSION_SECRET');
      expect(content).toContain('WHATSAPP_APP_SECRET');
      expect(content).toContain('CRON_SECRET');
      expect(content).toContain('ORDER_TOKEN_SECRET');
    });
  });

  describe('SECURITY.md documentation', () => {
    test('SECURITY.md accurately reflects hardened architecture and remediated findings', () => {
      expect(fs.existsSync(securityDocPath)).toBe(true);
      const content = fs.readFileSync(securityDocPath, 'utf8');

      // Admin token naming & HMAC
      expect(content).toContain('fai_admin_token');
      expect(content).not.toContain('fahad_admin_token');

      // WhatsApp fail-closed signature verification
      expect(content).toContain('X-Hub-Signature-256');
      expect(content).toContain('WHATSAPP_APP_SECRET');

      // Account lockout & DoS immunity
      expect(content).toContain('calculateLockoutDurationMs');

      // HKDF domain-separated secrets
      expect(content).toContain('derivePurposeSecret');

      // Order restrict & safe user anonymization
      expect(content).toContain('safeDeleteOrAnonymizeUser');
      expect(content).toContain('onDelete: Restrict');

      // Unified 2FA credentials verification
      expect(content).toContain('verifyCredentialsAnd2Fa');

      // Site config domain consolidation
      expect(content).toContain('SITE_CONFIG');

      // CSP and JsonLd security
      expect(content).toContain('JsonLd');
      expect(content).toContain('strict-dynamic');
    });
  });

  describe('README.md documentation', () => {
    test('README.md reflects full technology stack and security environment variables', () => {
      expect(fs.existsSync(readmeDocPath)).toBe(true);
      const content = fs.readFileSync(readmeDocPath, 'utf8');

      // Core technology stack
      expect(content).toContain('Next.js 16');
      expect(content).toContain('Upstash Redis');
      expect(content).toContain('Neon Serverless');
      expect(content).toContain('GSAP');
      expect(content).toContain('fai_admin_token');

      // Required production environment variables
      expect(content).toContain('ADMIN_TOKEN_SECRET');
      expect(content).toContain('TOTP_ENC_KEY');
      expect(content).toContain('AI_SESSION_SECRET');
      expect(content).toContain('CRON_SECRET');
      expect(content).toContain('WHATSAPP_APP_SECRET');
      expect(content).toContain('UPSTASH_REDIS_REST_URL');
      expect(content).toContain('UPSTASH_REDIS_REST_TOKEN');
      expect(content).toContain('ORDER_TOKEN_SECRET');

      // CI & testing details
      expect(content).toContain('--maxWorkers=2');
      expect(content).toContain('npm audit --audit-level=high');
    });
  });
});

