const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning all dummy data (description, image, icon, items) from Category table...');
  const res = await prisma.category.updateMany({
    data: {
      description: null,
      image: null,
      icon: null,
      items: null,
    },
  });
  console.log(`Successfully cleaned ${res.count} categories!`);

  const updated = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      icon: true,
      items: true,
      order: true,
    },
  });
  console.log('Categories in DB now:');
  console.table(updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
