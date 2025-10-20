// Quick test to verify database connection
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      },
      take: 3
    });
    
    console.log('✅ Database connection successful!');
    console.log('\n📋 Sample users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    // Test specific user for login
    const adminUser = await prisma.user.findUnique({
      where: { email: 'academy_admin@example.com' },
      select: {
        email: true,
        name: true,
        role: true,
        password: true
      }
    });
    
    console.log('\n🔐 Admin user check:');
    console.log(`  Email: ${adminUser?.email}`);
    console.log(`  Name: ${adminUser?.name}`);
    console.log(`  Has password: ${adminUser?.password ? 'YES ✅' : 'NO ❌'}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
