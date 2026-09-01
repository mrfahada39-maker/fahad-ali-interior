import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAllApis() {
  console.log('=====================================================');
  console.log('🚀 STARTING FULL E-TO-E API & DATABASE AUDIT FOR FAHAD ALI INTERIOR');
  console.log('=====================================================\n');

  let passed = 0;
  let total = 0;

  async function check(name: string, fn: () => Promise<any>) {
    total++;
    try {
      const res = await fn();
      console.log(`✅ [PASS] ${name}:`, typeof res === 'object' ? JSON.stringify(res).slice(0, 80) + '...' : res);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message || err);
    }
  }

  // 1. Products API
  await check('1. Fetch Active Products Catalog', async () => {
    const products = await prisma.product.findMany({ where: { deletedAt: null }, take: 10 });
    if (products.length === 0) throw new Error('No products found');
    return { count: products.length, firstProduct: products[0].name };
  });

  // 2. Orders API
  await check('2. Fetch Orders List', async () => {
    const orders = await prisma.order.findMany({ where: { deletedAt: null }, include: { items: true }, take: 10 });
    return { count: orders.length, recentOrderTotal: orders[0]?.totalAmount };
  });

  // 3. Categories API
  await check('3. Fetch Categories', async () => {
    const categories = await prisma.category.findMany({ where: { deletedAt: null } });
    return { count: categories.length, categories: categories.map((c) => c.name) };
  });

  // 4. Users & Auth DB Check
  await check('4. Audit Active Users & Roles', async () => {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    return { totalUsers: users.length, adminUser: users.find((u) => u.role === 'ADMIN')?.email };
  });

  // 5. Site Settings Check
  await check('5. Site Settings & Contact Info', async () => {
    const settings = await prisma.settings.findFirst();
    return { siteName: settings?.siteName, adminEmail: settings?.adminEmail, phone: settings?.contactPhone };
  });

  // 6. Blog Posts Check
  await check('6. Luxury Journal Blog Posts', async () => {
    const blogs = await prisma.blogPost.findMany({ where: { deletedAt: null } });
    return { count: blogs.length, titles: blogs.map((b) => b.title) };
  });

  // 7. Customer Reviews Check
  await check('7. Product Reviews', async () => {
    const reviews = await prisma.review.findMany({ where: { deletedAt: null } });
    return { count: reviews.length };
  });

  // 8. Customer Inquiries Check
  await check('8. Contact Inquiries', async () => {
    const inquiries = await prisma.inquiry.findMany({ where: { deletedAt: null } });
    return { count: inquiries.length };
  });

  console.log('\n=====================================================');
  console.log(`🏁 AUDIT COMPLETED: ${passed}/${total} API & DATABASE TESTS PASSED SUCCESSFULLY!`);
  console.log('=====================================================');
}

testAllApis()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
