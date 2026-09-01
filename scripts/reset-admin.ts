import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
  const password = 'Fahadinterior@2026!Secured';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  try {
    const user = await prisma.user.upsert({
      where: { email: 'admin@fahadali.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
      create: {
        name: 'Fahad Ali',
        email: 'admin@fahadali.com',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });
    console.log('Admin user updated successfully:', user.email);
    
    // Double check comparison
    const match = await bcrypt.compare(password, hashedPassword);
    console.log('Password match test:', match);
  } catch (error) {
    console.error('Error updating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
