const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pCount = await prisma.product.count();
  const cCount = await prisma.category.count();
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  console.log('Category Count:', cCount);
  console.log('Product Count:', pCount);
  console.log('Categories:', categories.map(c => ({ name: c.name, items: c.items })));
  console.log('Products:', products.map(p => ({ name: p.name, cat: p.category })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
