// Script to check admin@example.com user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    // Find user with email admin@example.com
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@example.com'
      }
    });

    if (adminUser) {
      console.log('Admin user found:');
      console.log(JSON.stringify(adminUser, null, 2));
    } else {
      console.log('No user found with email admin@example.com');
    }

    // Also check all admin users
    const allAdmins = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { role: 'ACADEMY_ADMIN' }
        ]
      }
    });

    console.log('\nAll admin users:');
    console.log(JSON.stringify(allAdmins, null, 2));
    
  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
