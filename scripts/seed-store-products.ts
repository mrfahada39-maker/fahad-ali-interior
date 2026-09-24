import { db } from '../src/lib/db';

async function seedProducts() {
  console.log('Ensuring Luxury Wardrobes category exists...');
  await db.category.upsert({
    where: { name: 'Luxury Wardrobes' },
    update: {},
    create: {
      name: 'Luxury Wardrobes',
      description: 'Custom solid wood master wardrobes',
      image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg',
      order: 7,
    },
  });

  const productsToUpsert = [
    {
      name: 'Royal Sheesham King Bed Suite with Tufted Headboard',
      category: 'Bedroom',
      price: 385000,
      description: 'Solid seasoned Sheesham rosewood master bed with hydraulic storage and 2 nightstands.',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&fm=webp&w=600&q=75',
      material: 'Solid Sheesham Rosewood',
      stockCount: 6,
      isPremium: true,
    },
    {
      name: 'Sultan 8-Seater Solid Sheesham Dining Set',
      category: 'Dining Room',
      price: 450000,
      description: 'Handcrafted solid Sheesham 8-seater dining table with 8 royal high-back cushioned chairs.',
      image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&fm=webp&w=600&q=75',
      material: 'Solid Sheesham Wood',
      stockCount: 4,
      isPremium: true,
    },
    {
      name: 'Turkish Velvet Accent Coffee Chair Set',
      category: 'Coffee Chairs',
      price: 95000,
      description: 'Pair of artisanal high-back coffee chairs in royal champagne velvet with solid Sheesham legs.',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&fm=webp&w=600&q=75',
      material: 'Solid Sheesham & Turkish Velvet',
      stockCount: 8,
      isPremium: false,
    },
    {
      name: 'Italian Marble & Brass Royal Center Table',
      category: 'Center tables',
      price: 125000,
      description: 'Natural Carrara marble top with antique gold brass finish solid Sheesham nesting base.',
      image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&fm=webp&w=600&q=75',
      material: 'Natural Marble & Sheesham',
      stockCount: 10,
      isPremium: false,
    },
    {
      name: 'Majestic Sheesham Royal Showcase & Console',
      category: 'Luxury Showcase',
      price: 280000,
      description: 'Exquisite hand-carved display console with tempered glass shelves and warm LED illumination.',
      image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785010771/fahad-ali-interior/categories/xpdpsxe6jvjs6ezukwmg.jpg',
      material: 'Solid Sheesham Wood & Glass',
      stockCount: 5,
      isPremium: true,
    },
    {
      name: 'Maharani 4-Door Solid Wood Luxury Wardrobe',
      category: 'Luxury Wardrobes',
      price: 420000,
      description: 'Heavy solid Sheesham 4-door master wardrobe with integrated lockable vault and velvet drawers.',
      image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg',
      material: 'Solid Sheesham & Rosewood',
      stockCount: 4,
      isPremium: true,
    },
  ];

  for (const p of productsToUpsert) {
    const existing = await db.product.findFirst({ where: { name: p.name, deletedAt: null } });
    if (!existing) {
      const created = await db.product.create({ data: p });
      console.log('Created product:', created.name, created.id);
    } else {
      console.log('Product already exists:', existing.name, existing.id);
    }
  }

  const all = await db.product.findMany({ where: { deletedAt: null }, select: { name: true, category: true, price: true } });
  console.log(`Total products in database: ${all.length}`);
}

seedProducts()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
