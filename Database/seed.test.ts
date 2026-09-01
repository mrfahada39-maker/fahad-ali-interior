import { PrismaClient, UserRole, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'TestPassword123!';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await db.user.upsert({
    where: { email: 'e2e-admin@example.com' },
    update: { password: passwordHash, emailVerified: new Date() },
    create: {
      name: 'E2E Admin',
      email: 'e2e-admin@example.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      phone: '+1 555 555 5555',
      emailVerified: new Date(),
    },
  });

  await db.user.upsert({
    where: { email: 'e2e-user@example.com' },
    update: { password: passwordHash, emailVerified: new Date() },
    create: {
      name: 'E2E Customer',
      email: 'e2e-user@example.com',
      password: passwordHash,
      role: UserRole.USER,
      phone: '+92 300 0000000',
      emailVerified: new Date(),
    },
  });

  const productCount = await db.product.count();
  if (productCount === 0) {
    await db.product.createMany({
      data: [
        { name: 'E2E Test Chair', price: 10000, category: 'Test', image: '/images/sofa.svg', stockCount: 10 },
        { name: 'E2E Test Table', price: 20000, category: 'Test', image: '/images/dining.svg', stockCount: 5 },
      ],
    });
  }

  await db.coupon.upsert({
    where: { code: 'E2E10' },
    update: {},
    create: { code: 'E2E10', discount: 10, discountType: DiscountType.PERCENTAGE, minOrderAmount: 0, maxUses: 100 },
  });

  console.log('Test seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
