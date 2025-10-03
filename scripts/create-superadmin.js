// Script to create a superadmin user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        email: 'superadmin@academy.com',
        role: 'SUPER_ADMIN'
      }
    });

    if (existingSuperAdmin) {
      console.log('Superadmin user already exists:', existingSuperAdmin.email);
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);

    // Create the superadmin user
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@academy.com',
        name: 'Super Administrator',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    });

    console.log('Superadmin user created successfully:');
    console.log({
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role
    });
    console.log('\nLogin credentials:');
    console.log('Email: superadmin@academy.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error creating superadmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
