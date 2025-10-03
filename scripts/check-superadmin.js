// Script to check superadmin user in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    // Find all users with SUPER_ADMIN role
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      }
    });

    console.log('Super Admin Users:');
    console.log(JSON.stringify(superAdmins, null, 2));
    
    if (superAdmins.length === 0) {
      console.log('No SUPER_ADMIN users found in the database.');
    }
  } catch (error) {
    console.error('Error checking superadmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();
