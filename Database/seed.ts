import { PrismaClient, UserRole, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();

const IMAGES = {
  bed: '/images/bed.svg',
  sofa: '/images/sofa.svg',
  dining: '/images/dining.svg',
  wardrobe: '/images/wardrobe.svg',
};

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('Set SEED_ADMIN_PASSWORD (min 12 chars) to run seed.');
  }

  await db.user.upsert({
    where: { email: 'admin@fahadali.com' },
    update: {
      name: 'Fahad Ali',
      role: UserRole.ADMIN,
      phone: '+92 300 1234567',
      emailVerified: new Date(),
      password: await bcrypt.hash(adminPassword, 12),
    },
    create: {
      name: 'Fahad Ali',
      email: 'admin@fahadali.com',
      password: await bcrypt.hash(adminPassword, 12),
      role: UserRole.ADMIN,
      phone: '+92 300 1234567',
      emailVerified: new Date(),
    },
  });

  const categories = [
    { name: 'Living Room', icon: 'Sofa', items: '25 Items', image: 'https://images.unsplash.com/photo-1583847268964-b28ce8f31586?auto=format&fit=crop&w=600&q=80', description: 'Premium living room furniture', order: 1 },
    { name: 'Bedroom', icon: 'BedDouble', items: '10 Items', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80', description: 'Luxury bedroom furniture', order: 2 },
    { name: 'Dining Room', icon: 'Coffee', items: '15 Items', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80', description: 'Exquisite dining sets', order: 3 },
    { name: 'Office', icon: 'Monitor', items: '12 Items', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80', description: 'Modern office setups', order: 4 },
    { name: 'Sofas', icon: 'Armchair', items: '24 Items', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80', description: 'Comfortable & stylish sofas', order: 5 },
    { name: 'Coffee Tables', icon: 'Table', items: '20 Items', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=600&q=80', description: 'Elegant coffee tables', order: 6 },
    { name: 'TV Units', icon: 'Tv', items: '14 Items', image: 'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=600&q=80', description: 'Modern TV units', order: 7 },
    { name: 'Storage', icon: 'Archive', items: '22 Items', image: 'https://images.unsplash.com/photo-1595514535415-eb942f2ed805?auto=format&fit=crop&w=600&q=80', description: 'Smart storage solutions', order: 8 },
    { name: 'Custom Furniture Solutions', icon: 'Sparkles', items: '', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80', description: 'Tailored to your space & style', isPromo: true, order: 9 },
    { name: 'Outdoor', icon: 'Sun', items: '10 Items', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', description: 'Outdoor living furniture', order: 10 },
    { name: 'Kids Furniture', icon: 'Baby', items: '08 Items', image: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=600&q=80', description: 'Safe & playful kids furniture', order: 11 },
    { name: 'Accessories', icon: 'Lamp', items: '30 Items', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', description: 'Decor & accessories', order: 12 },
  ];

  for (const c of categories) {
    await db.category.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    });
  }

  const productCount = await db.product.count();
  if (productCount > 0) {
    console.log(`Database already has ${productCount} products. Skipping product/settings/coupon seed.`);
    return;
  }

  const products = [
    { name: 'Royal Sheesham King Bed', price: 385000, category: 'Beds', image: IMAGES.bed, stockCount: 8, isPremium: true },
    { name: 'Lahore Velvet Queen Bed', price: 275000, category: 'Beds', image: IMAGES.bed, stockCount: 12 },
    { name: 'Imperial Chesterfield Sofa Set', price: 685000, category: 'Sofas', image: IMAGES.sofa, stockCount: 5, isPremium: true },
    { name: 'Karachi Contemporary L-Shape', price: 345000, category: 'Sofas', image: IMAGES.sofa, stockCount: 10 },
    { name: 'Sultan 8-Seater Dining Table', price: 795000, category: 'Dining', image: IMAGES.dining, stockCount: 3, isPremium: true },
    { name: 'Heritage Round Dining Set', price: 165000, category: 'Dining', image: IMAGES.dining, stockCount: 14 },
    { name: 'Maharani Walk-In Wardrobe', price: 575000, category: 'Wardrobes', image: IMAGES.wardrobe, stockCount: 4, isPremium: true },
    { name: 'Classic Hinged Door Almirah', price: 185000, category: 'Wardrobes', image: IMAGES.wardrobe, stockCount: 8 },
  ];

  for (const p of products) {
    await db.product.create({
      data: {
        ...p,
        description: `Handcrafted ${p.name} by Fahad Ali Interior.`,
        material: 'Premium Wood',
        dimensions: 'Custom',
      },
    });
  }

  const settings = await db.settings.findFirst();
  if (!settings) {
    await db.settings.create({
      data: {
        siteName: 'Fahad Ali Interior',
        adminEmail: 'info@fahadaliinterior.com',
        contactPhone: '+92 300 1234567',
        storeAddress: 'Gulberg III, Lahore, Pakistan',
        foundedYear: '2020',
        socialWhatsapp: 'https://wa.me/923001234567',
        accountTitle: 'Fahad Ali Interior',
        jazzcashNumber: '03001234567',
        easypaisaNumber: '03001234567',
        bankName: 'HBL',
        accountNumber: '12345678901234',
        iban: 'PK00HABB0000000000000000',
      },
    });
  }

  await db.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discount: 10,
      discountType: DiscountType.PERCENTAGE,
      minOrderAmount: 50000,
      maxUses: 100,
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
