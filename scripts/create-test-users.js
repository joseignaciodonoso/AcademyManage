// Script to create test users with different roles
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    // Hash the password - same for all test users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);
    
    // Define test users with different roles
    const testUsers = [
      {
        email: 'academy_admin@example.com',
        name: 'Director Academia',
        password: hashedPassword,
        role: 'ACADEMY_ADMIN',
        status: 'ACTIVE',
        academyId: 'academy-demo-123'
      },
      {
        email: 'coach@example.com',
        name: 'Instructor Principal',
        password: hashedPassword,
        role: 'COACH',
        status: 'ACTIVE',
        academyId: 'academy-demo-123',
        discipline: 'BJJ'
      },
      {
        email: 'coach2@example.com',
        name: 'Instructor Asistente',
        password: hashedPassword,
        role: 'COACH',
        status: 'ACTIVE',
        academyId: 'academy-demo-123',
        discipline: 'Karate'
      },
      {
        email: 'student_advanced@example.com',
        name: 'Estudiante Avanzado',
        password: hashedPassword,
        role: 'STUDENT',
        status: 'ACTIVE',
        academyId: 'academy-demo-123',
        beltLevel: 'BROWN',
        discipline: 'BJJ'
      },
      {
        email: 'student_beginner@example.com',
        name: 'Estudiante Principiante',
        password: hashedPassword,
        role: 'STUDENT',
        status: 'ACTIVE',
        academyId: 'academy-demo-123',
        beltLevel: 'WHITE',
        discipline: 'Karate'
      },
      {
        email: 'inactive_user@example.com',
        name: 'Usuario Inactivo',
        password: hashedPassword,
        role: 'STUDENT',
        status: 'INACTIVE',
        academyId: 'academy-demo-123'
      }
    ];
    
    console.log('Creando usuarios de prueba...');
    
    // Create each user if they don't already exist
    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        console.log(`Usuario ${userData.email} ya existe, omitiendo...`);
        continue;
      }
      
      const newUser = await prisma.user.create({
        data: userData
      });
      
      console.log(`Usuario creado: ${newUser.name} (${newUser.email}) - Rol: ${newUser.role}`);
    }
    
    console.log('\nTodos los usuarios creados exitosamente');
    console.log('Contraseña para todos los usuarios: Admin123!');
    
  } catch (error) {
    console.error('Error creando usuarios de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
