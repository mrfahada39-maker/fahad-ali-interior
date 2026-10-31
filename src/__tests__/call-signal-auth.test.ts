import { NextRequest } from 'next/server';
import { POST as callSignalPOST } from '@/app/api/calls/signal/route';
import { getVerifiedAdmin } from '@/lib/admin-auth';
import { getToken } from 'next-auth/jwt';

jest.mock('@/lib/admin-auth', () => ({
  getVerifiedAdmin: jest.fn(),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

const mockAuditCreate = jest.fn().mockResolvedValue({});
const mockAuditDeleteMany = jest.fn().mockResolvedValue({});
const mockAuditFindMany = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      create: (...args: unknown[]) => mockAuditCreate(...args),
      deleteMany: (...args: unknown[]) => mockAuditDeleteMany(...args),
      findMany: (...args: unknown[]) => mockAuditFindMany(...args),
    },
  },
}));

describe('WebRTC Call Signal Caller Identity Security (M3)', () => {
  const mockedGetVerifiedAdmin = getVerifiedAdmin as jest.Mock;
  const mockedGetToken = getToken as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetVerifiedAdmin.mockResolvedValue(null);
    mockedGetToken.mockResolvedValue(null);
  });

  it('rejects unauthenticated caller attempting to claim admin identity with 403', async () => {
    mockedGetVerifiedAdmin.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/calls/signal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'status',
        fromUserId: 'admin',
      }),
    });

    const res = await callSignalPOST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Admin authentication required');
  });

  it('rejects unauthenticated caller attempting to inject admin alias with 403', async () => {
    mockedGetVerifiedAdmin.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/calls/signal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'status',
        userAliases: ['admin', 'client'],
      }),
    });

    const res = await callSignalPOST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Admin authentication required');
  });

  it('derives identity from verified NextAuth session and ignores body spoofing', async () => {
    // Authenticated as Customer 123
    mockedGetToken.mockResolvedValue({
      id: 'cust_real_123',
      name: 'Real Customer',
      email: 'customer@domain.pk',
      role: 'USER',
    });

    // Attacker attempts to spoof fromUserId and add userAliases of another customer
    const req = new NextRequest('http://localhost:3000/api/calls/signal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'initiate',
        fromUserId: 'victim_spoofed_999',
        userAliases: ['victim_spoofed_999', 'victim@secret.com'],
        toUserId: 'admin',
        callType: 'voice',
        offerSdp: { type: 'offer', sdp: 'v=0...' },
      }),
    });

    const res = await callSignalPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Identity must be derived from verified session, ignoring spoofed body parameters
    expect(data.session.fromUserId).toBe('cust_real_123');
    expect(data.session.fromUserName).toBe('Real Customer');
    expect(data.session.fromUserEmail).toBe('customer@domain.pk');
  });

  it('derives admin identity from verified admin session token', async () => {
    mockedGetVerifiedAdmin.mockResolvedValue({
      id: 'admin_master_1',
      email: 'admin@fahadali.com',
      name: 'Super Admin',
      role: 'ADMIN',
    });

    const req = new NextRequest('http://localhost:3000/api/calls/signal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'initiate',
        toUserId: 'client_789',
        callType: 'video',
        offerSdp: { type: 'offer', sdp: 'v=0...' },
      }),
    });

    const res = await callSignalPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.session.fromUserId).toBe('admin');
    expect(data.session.fromUserName).toBe('Super Admin');
    expect(data.session.fromUserEmail).toBe('admin@fahadali.com');
  });

  it('restricts unauthenticated guest to safe guest identifier and strips untrusted aliases', async () => {
    mockedGetVerifiedAdmin.mockResolvedValue(null);
    mockedGetToken.mockResolvedValue(null);

    // Unauthenticated visitor calls admin
    const req = new NextRequest('http://localhost:3000/api/calls/signal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'initiate',
        fromUserId: 'visitor_tab_abc',
        fromUserName: 'Website Visitor',
        userAliases: ['victim@secret.com', 'admin'],
        toUserId: 'admin',
        callType: 'voice',
      }),
    });

    // Attempting 'admin' in userAliases is caught and blocked with 403
    const res = await callSignalPOST(req);
    expect(res.status).toBe(403);
  });

  it('allows safe unauthenticated guest to initiate call to concierge with scoped guest ID', async () => {
    mockedGetVerifiedAdmin.mockResolvedValue(null);
    mockedGetToken.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/calls/signal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'initiate',
        fromUserId: 'client_guest_1',
        fromUserName: 'Showroom Visitor',
        toUserId: 'admin',
        callType: 'voice',
      }),
    });

    const res = await callSignalPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.session.fromUserId).toBe('client_guest_1');
    expect(data.session.fromUserName).toBe('Showroom Visitor');
  });
});

