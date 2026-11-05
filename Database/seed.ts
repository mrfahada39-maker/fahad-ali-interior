import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('Set SEED_ADMIN_PASSWORD (min 12 chars) to run seed.');
  }

  // 1. Official Super Admin Account (loaded from environment variables)
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@fahadali.pk';
  const adminPhone = process.env.ADMIN_PHONE || process.env.NEXT_PUBLIC_CONTACT_PHONE || null;

  await db.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Fahad Ali',
      role: UserRole.ADMIN,
      phone: adminPhone,
      emailVerified: new Date(),
      password: await bcrypt.hash(adminPassword, 12),
    },
    create: {
      name: 'Fahad Ali',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      role: UserRole.ADMIN,
      phone: adminPhone,
      emailVerified: new Date(),
    },
  });

  // 2. Official Luxury Store Categories (Using verified local WebP photography)
  const categoryDefinitions = [
    { name: 'Living Room', icon: 'Sofa', image: '/cat-thumb-sofas-2x.webp', description: 'Handcrafted luxury living room suites', order: 1 },
    { name: 'Bedroom', icon: 'BedDouble', image: '/cat-thumb-beds-2x.webp', description: 'Royal solid Sheesham bedroom suites', order: 2 },
    { name: 'Dining Room', icon: 'Coffee', image: '/cat-thumb-dining-2x.webp', description: 'Exquisite royal dining tables and seating', order: 3 },
    { name: 'Office', icon: 'Monitor', image: '/cat-thumb-chairs-2x.webp', description: 'Executive timber desks and luxury armchairs', order: 4 },
    { name: 'Sofas', icon: 'Armchair', image: '/cat-thumb-sofas-2x.webp', description: 'Turkish velvet and Chesterfield sofas', order: 5 },
    { name: 'Coffee Tables', icon: 'Table', image: '/cat-thumb-centertables-2x.webp', description: 'Brass-inlaid and carved center tables', order: 6 },
    { name: 'TV Units', icon: 'Tv', image: '/cat-thumb-tvunits-2x.webp', description: 'Architectural media consoles and showcases', order: 7 },
    { name: 'Storage', icon: 'Archive', image: '/cat-thumb-wardrobes-2x.webp', description: 'Bespoke walk-in and hinged wardrobes', order: 8 },
    { name: 'Custom Furniture Solutions', icon: 'Sparkles', image: '/hero-living-room-img1-4k.webp', description: 'Tailored architectural commissions', isPromo: true, order: 9 },
    { name: 'Outdoor', icon: 'Sun', image: '/cat-thumb-chairs-2x.webp', description: 'All-weather hardwood outdoor sets', order: 10 },
    { name: 'Kids Furniture', icon: 'Baby', image: '/cat-thumb-beds-2x.webp', description: 'Handcrafted safe timber bedroom furniture', order: 11 },
    { name: 'Accessories', icon: 'Lamp', image: '/cat-thumb-accessories-2x.webp', description: 'Luxury decor, consoles and brass lighting', order: 12 },
  ];

  for (const c of categoryDefinitions) {
    const actualCount = c.isPromo
      ? 0
      : await db.product.count({
          where: {
            category: { equals: c.name, mode: 'insensitive' },
            deletedAt: null,
          },
        });
    const categoryData = {
      ...c,
      items: c.isPromo ? '' : `${actualCount} ${actualCount === 1 ? 'Masterpiece' : 'Masterpieces'}`,
    };
    await db.category.upsert({
      where: { name: c.name },
      update: categoryData,
      create: categoryData,
    });
  }

  // 3. Official Business Settings
  const settings = await db.settings.findFirst();
  const settingsPayload = {
    siteName: 'Fahad Ali Interior',
    adminEmail: process.env.ADMIN_EMAIL || 'concierge@fahadali.pk',
    contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
    storeAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS || 'Main Boulevard, Gulberg III, Lahore, Pakistan',
    foundedYear: '2016',
    socialWhatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, '')}` : '',
    socialFacebook: '',
    socialInstagram: '',
    accountTitle: process.env.NEXT_PUBLIC_BANK_ACCOUNT_TITLE || 'Fahad Ali Interior',
    jazzcashNumber: process.env.JAZZCASH_NUMBER || '',
    easypaisaNumber: process.env.EASYPAISA_NUMBER || '',
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || 'Meezan Bank Limited',
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '',
    iban: process.env.NEXT_PUBLIC_BANK_IBAN || '',
  };

  if (!settings) {
    await db.settings.create({ data: settingsPayload });
  } else {
    await db.settings.update({
      where: { id: settings.id },
      data: settingsPayload,
    });
  }

  console.log('Seed completed cleanly with zero dummy data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
