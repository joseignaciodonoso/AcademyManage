// Script to update passwords for users without them
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updatePasswords() {
  try {
    // Hash the default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);
    
    // Users to update
    const usersToUpdate = ['ramiro@gmail.com', 'isa@gmail.com'];
    
    console.log('Actualizando contraseñas para usuarios...\n');
    
    for (const email of usersToUpdate) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        console.log(`⚠️  Usuario ${email} no encontrado`);
        continue;
      }
      
      if (user.password) {
        console.log(`ℹ️  Usuario ${email} ya tiene contraseña configurada`);
        continue;
      }
      
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      
      console.log(`✅ Contraseña actualizada para ${email}`);
    }
    
    console.log('\n✨ Proceso completado');
    console.log('Contraseña configurada: Admin123!');
    
  } catch (error) {
    console.error('Error actualizando contraseñas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();
