// Quick script to set a user as ADMIN by email
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAIL = 'mrfahado39@gmail.com';

async function makeAdmin() {
  try {
    const user = await prisma.user.update({
      where: { email: EMAIL },
      data: {
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });
    console.log('✅ SUCCESS! User is now ADMIN:');
    console.log('   Name :', user.name);
    console.log('   Email:', user.email);
    console.log('   Role :', user.role);
    console.log('');
    console.log('👉 Logout aur dobara login karein — Admin Dashboard dikhe ga!');
  } catch (error) {
    if (error.code === 'P2025') {
      console.error('❌ User nahi mila:', EMAIL);
      console.error('   Pehle website pe is email se register karein.');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
