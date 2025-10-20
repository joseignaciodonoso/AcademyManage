const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAcademySlug() {
  try {
    const academy = await prisma.academy.findFirst();
    
    if (!academy) {
      console.log('❌ No academy found');
      return;
    }
    
    console.log('\n📚 Academia encontrada:');
    console.log('  - Nombre:', academy.name);
    console.log('  - Slug:', academy.slug || '❌ NO TIENE SLUG');
    console.log('  - ID:', academy.id);
    console.log('\n🔗 URL para alumnos:');
    console.log(`  http://localhost:3001/${academy.slug || '[SIN-SLUG]'}/signin`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getAcademySlug();
