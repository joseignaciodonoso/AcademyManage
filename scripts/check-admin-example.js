// Script to check if admin@example.com exists in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminExample() {
  try {
    // Find user with email admin@example.com
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@example.com'
      }
    });

    if (adminUser) {
      console.log('User admin@example.com found:');
      console.log(JSON.stringify(adminUser, null, 2));
    } else {
      console.log('No user found with email admin@example.com');
      
      // Check if there are any users in the database
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true
        }
      });
      
      console.log('\nAll users in the database:');
      console.log(JSON.stringify(allUsers, null, 2));
    }
  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminExample();
