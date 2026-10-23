const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Permanently deleting all products from Product table...');
  // Delete related records first if any
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
