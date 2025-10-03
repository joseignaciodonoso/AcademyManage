// Script to list all users with their profiles
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    // Get all users with relevant profile information
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        academyId: true,
        beltLevel: true,
        discipline: true
      },
      orderBy: {
        role: 'asc'
      }
    });

    console.log('=== LISTADO DE USUARIOS PARA PRUEBAS ===\n');
    
    // Group users by role for better readability
    const groupedUsers = users.reduce((acc, user) => {
      const role = user.role;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(user);
      return acc;
    }, {});

    // Print users by role
    for (const [role, usersInRole] of Object.entries(groupedUsers)) {
      console.log(`\n== USUARIOS CON ROL: ${role} ==`);
      usersInRole.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'Sin nombre'} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Estado: ${user.status}`);
        console.log(`   Academia ID: ${user.academyId || 'N/A'}`);
        if (user.beltLevel) console.log(`   Nivel de cinturón: ${user.beltLevel}`);
        if (user.discipline) console.log(`   Disciplina: ${user.discipline}`);
      });
    }

    console.log('\n=== CREDENCIALES DE ACCESO ===');
    console.log('Todos los usuarios creados tienen la misma contraseña: Admin123!');
    
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers();
