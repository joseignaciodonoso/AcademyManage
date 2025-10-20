const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetStudentPassword() {
  try {
    console.log('🔍 Buscando estudiantes...\n');
    
    // Buscar primer estudiante
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: {
        academy: true,
      }
    });
    
    if (!student) {
      console.log('❌ No se encontraron estudiantes');
      return;
    }
    
    // Establecer contraseña conocida
    const newPassword = 'Student123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: student.id },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Contraseña actualizada exitosamente!\n');
    console.log('📋 Credenciales de acceso:');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  📧 Email:      ${student.email}`);
    console.log(`  🔑 Password:   ${newPassword}`);
    console.log(`  👤 Nombre:     ${student.name || 'N/A'}`);
    console.log(`  🏫 Academia:   ${student.academy?.name || 'N/A'}`);
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔗 URL de Login:');
    console.log(`  http://localhost:3001/${student.academy?.slug}/signin\n`);
    console.log('📝 Pasos para ingresar:');
    console.log('  1. Abre el navegador en la URL de arriba');
    console.log('  2. Ingresa el email y password mostrados');
    console.log('  3. Serás redirigido al dashboard del alumno (/app)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetStudentPassword();
