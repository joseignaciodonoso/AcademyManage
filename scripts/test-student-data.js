const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStudentData() {
  try {
    console.log('🔍 Testing student data availability...\n');
    
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: {
        memberships: {
          include: { plan: true },
          take: 1
        },
        attendances: { take: 5 },
        enrollments: { take: 3 }
      }
    });
    
    if (!student) {
      console.log('❌ No students found in database');
      return;
    }
    
    console.log('✅ Student found:', student.email);
    console.log('📊 Data summary:');
    console.log(`  - Memberships: ${student.memberships.length}`);
    console.log(`  - Attendances: ${student.attendances.length}`);
    console.log(`  - Enrollments: ${student.enrollments.length}`);
    
    if (student.memberships.length > 0) {
      console.log(`\n💳 Active membership:`);
      console.log(`  - Plan: ${student.memberships[0].plan.name}`);
      console.log(`  - Status: ${student.memberships[0].status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentData();
