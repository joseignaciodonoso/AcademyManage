// Script to create admin@example.com user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdminExample() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'admin@example.com'
      }
    });

    if (existingUser) {
      console.log('User admin@example.com already exists:', existingUser.email);
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);

    // Create the admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin Example',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    });

    console.log('Admin user created successfully:');
    console.log({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    });
    console.log('\nLogin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminExample();
