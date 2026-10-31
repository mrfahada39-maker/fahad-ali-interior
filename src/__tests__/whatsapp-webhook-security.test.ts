import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { GET, POST } from '@/app/api/whatsapp/webhook/route';

describe('C1: WhatsApp Webhook Security & Fail-Closed Signature Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.WHATSAPP_TEST_MODE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET Handshake Verification', () => {
    it('returns 200 and challenge when verify_token matches WHATSAPP_WEBHOOK_VERIFY_TOKEN', async () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'my_secure_verify_token_123';

      const req = new NextRequest(
        'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=my_secure_verify_token_123&hub.challenge=challenge_abc_123'
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe('challenge_abc_123');
    });

    it('returns 403 when verify_token does not match', async () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'correct_token';

      const req = new NextRequest(
        'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge'
      );
      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it('returns 403 when verify_token attempts to fallback to ADMIN_TOKEN_SECRET', async () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'configured_webhook_token';
      process.env.ADMIN_TOKEN_SECRET = 'admin_secret_fallback_should_not_work';

      const req = new NextRequest(
        'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=admin_secret_fallback_should_not_work&hub.challenge=test_challenge'
      );
      const res = await GET(req);

      // Must fail closed (403), never falling back to ADMIN_TOKEN_SECRET
      expect(res.status).toBe(403);
    });
  });

  describe('POST Webhook Signature Verification (Fail-Closed)', () => {
    it('fails closed with 401 when WHATSAPP_APP_SECRET is not configured', async () => {
      delete process.env.WHATSAPP_APP_SECRET;
      delete process.env.META_APP_SECRET;

      const body = JSON.stringify({ entry: [] });
      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('secret');
    });

    it('fails closed with 401 when X-Hub-Signature-256 header is missing', async () => {
      process.env.WHATSAPP_APP_SECRET = 'test_app_secret_1234567890123456';

      const body = JSON.stringify({ entry: [] });
      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('X-Hub-Signature-256');
    });

    it('fails closed with 401 when X-Hub-Signature-256 header is invalid or tampered', async () => {
      process.env.WHATSAPP_APP_SECRET = 'test_app_secret_1234567890123456';

      const body = JSON.stringify({ entry: [] });
      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=invalid_tampered_signature_hex_00000000000000000000000000000000',
        },
        body,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('signature');
    });

    it('accepts POST and returns 200 when X-Hub-Signature-256 matches exact HMAC-SHA256', async () => {
      const secret = 'test_app_secret_1234567890123456';
      process.env.WHATSAPP_APP_SECRET = secret;

      const body = JSON.stringify({
        entry: [
          {
            id: '0',
            changes: [
              {
                value: {
                  messages: [{ id: 'wamid.test', from: '123456789', type: 'text', text: { body: 'test' } }],
                },
              },
            ],
          },
        ],
      });

      const validSig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': validSig,
        },
        body,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('allows bypass only when WHATSAPP_TEST_MODE is explicitly set to true', async () => {
      delete process.env.WHATSAPP_APP_SECRET;
      process.env.WHATSAPP_TEST_MODE = 'true';

      const body = JSON.stringify({ entry: [] });
      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const res = await POST(req);
      // In explicit test mode without secret or signature, it proceeds past signature check
      expect(res.status).toBe(200);
    });

    it('does not authorize requests from NEXT_PUBLIC_WHATSAPP_NUMBER as an admin phone', async () => {
      const secret = 'test_app_secret_1234567890123456';
      process.env.WHATSAPP_APP_SECRET = secret;
      process.env.ADMIN_WHATSAPP_NUMBER = '+92 320 7006110';
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '+92 333 9999999';

      const body = JSON.stringify({
        entry: [
          {
            id: '123',
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: 'wamid.msg1',
                      from: '923339999999',
                      type: 'interactive',
                      interactive: { button_reply: { id: 'verify_ORD999' } },
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

      const validSig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': validSig,
        },
        body,
      });

      const res = await POST(req);
      // NEXT_PUBLIC_WHATSAPP_NUMBER must NOT be recognized as admin -> 403 Forbidden
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Unauthorized phone number');
    });
  });
});

