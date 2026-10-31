import { describe, it, expect, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import fs from 'fs';
import path from 'path';

describe('H1: Unified Content-Security-Policy with Per-Request Nonce & strict-dynamic', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as { NODE_ENV: string }).NODE_ENV = originalEnv;
  });

  it('enforces strict-dynamic and per-request nonce without unsafe-inline or unsafe-eval in production', async () => {
    (process.env as { NODE_ENV: string }).NODE_ENV = 'production';

    const req = new NextRequest('https://fahad-ali-interior.vercel.app/shop', {
      method: 'GET',
      headers: { host: 'fahad-ali-interior.vercel.app' },
    });

    const res = await proxy(req);
    const csp = res.headers.get('Content-Security-Policy');
    const nonce = res.headers.get('x-nonce');

    expect(csp).toBeDefined();
    expect(nonce).toBeDefined();
    expect(nonce?.length).toBeGreaterThan(16);

    // Must enforce per-request nonce and strict-dynamic
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("'strict-dynamic'");

    // Must NOT contain unsafe-inline or unsafe-eval in script-src for production
    const scriptSrcMatch = csp?.match(/script-src[^;]+/);
    expect(scriptSrcMatch).toBeTruthy();
    const scriptSrc = scriptSrcMatch![0];

    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");

    // Supports Vercel Analytics and Google APIs
    expect(scriptSrc).toContain('https://va.vercel-scripts.com');
    expect(scriptSrc).toContain('https://vitals.vercel-insights.com');
  });

  it('generates a distinct cryptographic nonce for each request', async () => {
    (process.env as { NODE_ENV: string }).NODE_ENV = 'production';

    const req1 = new NextRequest('https://fahad-ali-interior.vercel.app/', {
      method: 'GET',
      headers: { host: 'fahad-ali-interior.vercel.app' },
    });
    const req2 = new NextRequest('https://fahad-ali-interior.vercel.app/', {
      method: 'GET',
      headers: { host: 'fahad-ali-interior.vercel.app' },
    });

    const res1 = await proxy(req1);
    const res2 = await proxy(req2);

    const nonce1 = res1.headers.get('x-nonce');
    const nonce2 = res2.headers.get('x-nonce');

    expect(nonce1).toBeTruthy();
    expect(nonce2).toBeTruthy();
    expect(nonce1).not.toBe(nonce2);
  });

  it('verifies next.config.ts does NOT define a duplicate static Content-Security-Policy header', async () => {
    const configPath = path.join(process.cwd(), 'next.config.ts');
    const content = fs.readFileSync(configPath, 'utf8');

    // next.config.ts must not configure Content-Security-Policy in its headers
    expect(content).not.toMatch(/{\s*key:\s*['"]Content-Security-Policy['"]/);
  });
});
