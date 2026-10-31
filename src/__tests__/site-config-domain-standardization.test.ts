import { SITE_CONFIG } from '@/lib/site-config';
import fs from 'fs';
import path from 'path';

describe('L2: Site Domain & Email Constants Standardization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('1. SITE_CONFIG Dynamic Domain & Email Resolution', () => {
    it('resolves siteUrl and domain from NEXT_PUBLIC_APP_URL', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://fahadaliinterior.com';
      delete process.env.NEXTAUTH_URL;
      delete process.env.VERCEL_URL;

      expect(SITE_CONFIG.siteUrl).toBe('https://fahadaliinterior.com');
      expect(SITE_CONFIG.domain).toBe('fahadaliinterior.com');
      expect(SITE_CONFIG.emails.noReply).toBe('no-reply@fahadaliinterior.com');
    });

    it('resolves siteUrl and domain for preview deployment on Vercel', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXTAUTH_URL;
      process.env.VERCEL_URL = 'fahad-preview-123.vercel.app';

      expect(SITE_CONFIG.siteUrl).toBe('https://fahad-preview-123.vercel.app');
      expect(SITE_CONFIG.domain).toBe('fahad-preview-123.vercel.app');
      expect(SITE_CONFIG.emails.noReply).toBe('no-reply@fahad-preview-123.vercel.app');
    });

    it('constructs standard RFC-compliant fromHeader using SMTP_USER when configured', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://fahadaliinterior.com';
      process.env.SMTP_USER = 'notifications@fahadaliinterior.com';
      delete process.env.SMTP_FROM;

      expect(SITE_CONFIG.emails.fromHeader).toBe(
        'Fahad Ali Interior <notifications@fahadaliinterior.com>'
      );
    });

    it('constructs standard RFC-compliant fromHeader using noReply fallback', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://fahadaliinterior.com';
      delete process.env.SMTP_USER;
      delete process.env.SMTP_FROM;

      expect(SITE_CONFIG.emails.fromHeader).toBe(
        'Fahad Ali Interior <no-reply@fahadaliinterior.com>'
      );
    });

    it('honors custom SMTP_FROM override when provided', () => {
      process.env.SMTP_FROM = 'Bespoke Atelier <concierge@fahadali.pk>';
      expect(SITE_CONFIG.emails.fromHeader).toBe(
        'Bespoke Atelier <concierge@fahadali.pk>'
      );
    });

    it('resolves pushSubject email conforming to mailto URI scheme', () => {
      delete process.env.VAPID_SUBJECT;
      expect(SITE_CONFIG.emails.pushSubject).toMatch(/^mailto:.+@.+/);
    });
  });

  describe('2. Codebase Static Verification of Standardized Origin and Domains', () => {
    const rootDir = process.cwd();

    it('verifies src/lib/whatsapp.ts does not contain hardcoded vercel.app domains', () => {
      const content = fs.readFileSync(path.join(rootDir, 'src/lib/whatsapp.ts'), 'utf8');
      expect(content).not.toContain('https://fahad-ali-interior.vercel.app');
      expect(content).toContain('getSiteUrl()');
    });

    it('verifies src/lib/whatsapp-admin-copilot.ts uses dynamic getSiteUrl()', () => {
      const content = fs.readFileSync(path.join(rootDir, 'src/lib/whatsapp-admin-copilot.ts'), 'utf8');
      expect(content).not.toContain('https://fahad-ali-interior.vercel.app');
      expect(content).toContain('getSiteUrl()');
    });

    it('verifies src/lib/phone-otp.ts uses dynamic getSiteUrl() for login link', () => {
      const content = fs.readFileSync(path.join(rootDir, 'src/lib/phone-otp.ts'), 'utf8');
      expect(content).not.toContain("'https://fahadali.pk/login'");
      expect(content).toContain('${getSiteUrl()}/login');
    });

    it('verifies src/app/blog/[slug]/page.tsx uses dynamic getSiteUrl() for @id', () => {
      const content = fs.readFileSync(path.join(rootDir, 'src/app/blog/[slug]/page.tsx'), 'utf8');
      expect(content).not.toContain('https://fahadaliinterior.com/blog/');
      expect(content).toContain('${getSiteUrl()}/blog/${article.slug}');
    });

    it('verifies src/lib/user-deletion.ts uses SITE_CONFIG.domain for anonymization', () => {
      const content = fs.readFileSync(path.join(rootDir, 'src/lib/user-deletion.ts'), 'utf8');
      expect(content).not.toContain('@deleted.fahadali.pk');
      expect(content).toContain('@deleted.${SITE_CONFIG.domain}');
    });
  });
});

