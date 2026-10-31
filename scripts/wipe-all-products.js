const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_WIPE !== 'true') {
    throw new Error('FATAL: Destructive script wipe-all-products.js blocked in production environment.');
  }

  if (process.env.CONFIRM_WIPE !== 'true') {
    console.error('SAFETY BLOCKED: You must set CONFIRM_WIPE=true in your environment to execute database wipe.');
    process.exit(1);
  }

  console.log('Permanently deleting all products from Product table in development...');
  await prisma.orderItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  
  const res = await prisma.product.deleteMany({});
  console.log(`Deleted ${res.count} products!`);

  const count = await prisma.product.count();
  console.log(`Total Products in DB now: ${count}`);

  const catCount = await prisma.category.count();
  console.log(`Total Categories in DB: ${catCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
