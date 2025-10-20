// Test NextAuth login endpoint
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testing login credentials...\n');
    
    const email = 'academy_admin@example.com';
    const password = 'Admin123!';
    
    // Simulate what NextAuth does
    const user = await prisma.user.findUnique({
      where: { email },
      include: { academy: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    
    if (!user.password) {
      console.log('❌ User has no password');
      return;
    }
    
    console.log('✅ User has password set');
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      console.log('✅ Password is valid!');
      console.log('\n🎉 Login credentials are correct!');
      console.log(`\nYou can login with:`);
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
    } else {
      console.log('❌ Password is invalid');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
