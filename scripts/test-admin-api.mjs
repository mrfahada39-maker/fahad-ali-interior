import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const origin = process.env.ENTERPRISE_API_ORIGIN?.replace(/\/$/, '') || 'http://localhost:3001';
const proxy = 'http://127.0.0.1:3000';
const key = process.env.INTERNAL_PROXY_KEY || 'dev-internal-proxy-key';

const admin = await prisma.user.findFirst({
  where: { role: 'ADMIN', deletedAt: null },
  select: { id: true, email: true, role: true },
});

console.log('admin user:', admin);
if (!admin) {
  console.error('No ADMIN user in DB');
  process.exit(1);
}

const bridgeRes = await fetch(`${origin}/api/v1/auth/session-bridge`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-internal-proxy-key': key },
  body: JSON.stringify({ userId: admin.id }),
});
const bridgeBody = await bridgeRes.json();
console.log('session-bridge', bridgeRes.status, JSON.stringify(bridgeBody).slice(0, 200));

const tokens = bridgeBody.data ?? bridgeBody;
if (!tokens.accessToken) process.exit(1);

const bundleRes = await fetch(`${proxy}/api/v1/admin/dashboard-bundle`, {
  headers: { Authorization: `Bearer ${tokens.accessToken}` },
});
const bundleText = await bundleRes.text();
console.log('dashboard-bundle', bundleRes.status, bundleText.slice(0, 300));

await prisma.$disconnect();
