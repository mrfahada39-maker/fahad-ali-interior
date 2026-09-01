import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();
async function main() {
  await db.user.upsert({
    where: { email: 'mrfahada39@gmail.com' },
    update: { role: UserRole.ADMIN, emailVerified: new Date() },
    create: { email: 'mrfahada39@gmail.com', name: 'Fahad Admin', password: await bcrypt.hash('fahadali', 12), role: UserRole.ADMIN, emailVerified: new Date() }
  });
  console.log('Admin user created/updated');
  const count = await db.product.count();
  if (count === 0) {
    await db.$executeRawUnsafe(`INSERT INTO "Product" (id, name, slug, description, price, category, "stockCount", material, dimensions, image) VALUES 
      ('seed-1', 'Royal Sheesham King Bed', 'royal-sheesham-king-bed', 'Handcrafted by Fahad Ali Interior.', 385000, 'Beds', 8, 'Premium Wood', 'Custom', '/images/bed.svg'),
      ('seed-2', 'Lahore Velvet Queen Bed', 'lahore-velvet-queen-bed', 'Handcrafted by Fahad Ali Interior.', 275000, 'Beds', 12, 'Premium Wood', 'Custom', '/images/bed.svg'),
      ('seed-3', 'Imperial Chesterfield Sofa Set', 'imperial-chesterfield-sofa-set', 'Handcrafted by Fahad Ali Interior.', 685000, 'Sofas', 5, 'Premium Wood', 'Custom', '/images/sofa.svg')`);
    console.log('Products seeded');
  } else {
    console.log(`Products already exist: ${count}`);
  }
  console.log('Done');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
