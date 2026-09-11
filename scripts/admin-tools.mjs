import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const action = process.argv[2] || 'list';
const arg = process.argv[3];

async function main() {
  try {
    if (action === 'make-admin') {
      const email = arg || 'mrfahado39@gmail.com';
      const user = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN', emailVerified: new Date() },
      });
      console.log('✅ User is now ADMIN:', user.email);
    } else if (action === 'verify-user') {
      const q = arg || '';
      const res = await prisma.user.updateMany({
        where: { email: { contains: q } },
        data: { emailVerified: new Date() },
      });
      console.log('✅ Marked as verified:', res);
    } else if (action === 'check-user') {
      const q = arg || '';
      const users = await prisma.user.findMany({
        where: { email: { contains: q } },
        select: { id: true, email: true, name: true, role: true, emailVerified: true, password: true },
      });
      console.log('Found users:', users.map((u) => ({ ...u, password: u.password ? 'set' : 'none' })));
    } else if (action === 'check-db') {
      const orders = await prisma.order.findMany({
        include: { items: true, user: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      console.log('Total orders in DB:', orders.length);
    } else {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      console.log('📋 All users in database:');
      users.forEach((u) => console.log(`  [${u.role}] ${u.email} — ${u.name}`));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
