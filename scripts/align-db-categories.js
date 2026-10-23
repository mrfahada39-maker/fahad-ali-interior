const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Aligning product categories with Neon Category table...');

  // Update existing products to exact DB category names
  await prisma.product.updateMany({
    where: { name: { contains: 'L-Shape Sectional' } },
    data: { category: 'Sofas' },
  });

  await prisma.product.updateMany({
    where: { category: 'Luxury Wardrobes' },
    data: { category: 'Storage' },
  });

  await prisma.product.updateMany({
    where: { category: { in: ['Center Tables', 'Coffee Chairs'] } },
    data: { category: 'Coffee Tables' },
  });

  await prisma.product.updateMany({
    where: { category: 'Luxury Showcase' },
    data: { category: 'Storage' },
  });

  // Check if Office product exists, if not add it
  const officeCount = await prisma.product.count({ where: { category: 'Office' } });
  if (officeCount === 0) {
    await prisma.product.create({
      data: {
        name: 'Presidential Hand-Carved Sheesham Executive Desk',
        price: 285000,
        category: 'Office',
        image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80'],
        dimensions: '6.5 ft (L) × 3.5 ft (W) × 30 in (H)',
        material: '100% Solid Seasoned Sheesham Wood with Brass Accents',
        stockCount: 4,
        isPremium: true,
        description: 'Commanding executive workstation featuring lockable drawers, cable management channels, and hand-carved floral borders.',
      },
    });
    console.log('Created Office Desk product');
  }

  // Check if TV Unit product exists, if not add it
  const tvCount = await prisma.product.count({ where: { category: 'TV Units' } });
  if (tvCount === 0) {
    await prisma.product.create({
      data: {
        name: 'Chinioti Handcrafted Solid Sheesham Media & TV Console',
        price: 195000,
        category: 'TV Units',
        image: 'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=800&q=80'],
        dimensions: '7 ft (L) × 18 in (D) × 26 in (H)',
        material: '100% Solid Seasoned Sheesham Wood & Soft-Close Drawers',
        stockCount: 6,
        isPremium: true,
        description: 'Modern luxury entertainment console accommodating up to 85-inch screens with hidden cable ports and storage bays.',
      },
    });
    console.log('Created TV Unit product');
  }

  // Link categoryId to products and update Category.items
  const allCats = await prisma.category.findMany();
  for (const cat of allCats) {
    const prods = await prisma.product.findMany({
      where: { category: { equals: cat.name, mode: 'insensitive' } },
    });
    const count = prods.length;
    await prisma.category.update({
      where: { id: cat.id },
      data: {
        items: count > 0 ? `${count} ${count === 1 ? 'Masterpiece' : 'Masterpieces'}` : 'Bespoke Collection',
      },
    });
    for (const p of prods) {
      await prisma.product.update({
        where: { id: p.id },
        data: { categoryId: cat.id },
      });
    }
    console.log(`Category "${cat.name}": ${count} products linked`);
  }

  const finalProds = await prisma.product.findMany({ select: { name: true, category: true } });
  console.log('Final Products count:', finalProds.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
