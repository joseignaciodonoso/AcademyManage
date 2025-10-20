const { PrismaClient } = require('@prisma/client');
const { addDays, addHours, subDays, startOfDay } = require('date-fns');

const prisma = new PrismaClient();

async function seedStudentData() {
  console.log('🌱 Starting student data seeding...\n');

  try {
    // Get academy and branch
    const academy = await prisma.academy.findFirst();
    if (!academy) {
      console.error('❌ No academy found. Please create an academy first.');
      return;
    }
    console.log(`✅ Using academy: ${academy.name} (${academy.id})`);

    const branch = await prisma.branch.findFirst({
      where: { academyId: academy.id }
    });
    if (!branch) {
      console.error('❌ No branch found. Please create a branch first.');
      return;
    }
    console.log(`✅ Using branch: ${branch.name} (${branch.id})`);

    // Get a coach
    const coach = await prisma.user.findFirst({
      where: { 
        academyId: academy.id,
        role: { in: ['ACADEMY_ADMIN', 'COACH'] }
      }
    });
    if (!coach) {
      console.error('❌ No coach found. Please create a coach first.');
      return;
    }
    console.log(`✅ Using coach: ${coach.name} (${coach.id})\n`);

    // Get students
    const students = await prisma.user.findMany({
      where: { 
        academyId: academy.id,
        role: 'STUDENT'
      },
      take: 10 // Seed data for first 10 students
    });

    if (students.length === 0) {
      console.error('❌ No students found.');
      return;
    }
    console.log(`✅ Found ${students.length} students\n`);

    // Create classes for the next 30 days
    console.log('📅 Creating scheduled classes...');
    const classes = [];
    const today = startOfDay(new Date());
    
    const classTemplates = [
      { title: 'Karate Básico', discipline: 'Karate', level: 'Principiante', duration: 1.5 },
      { title: 'Karate Intermedio', discipline: 'Karate', level: 'Intermedio', duration: 1.5 },
      { title: 'Karate Avanzado', discipline: 'Karate', level: 'Avanzado', duration: 2 },
      { title: 'Sparring', discipline: 'Karate', level: 'Todos', duration: 1 },
      { title: 'Kata', discipline: 'Karate', level: 'Intermedio', duration: 1 },
    ];

    // Create classes for next 30 days
    for (let day = 0; day < 30; day++) {
      const classDate = addDays(today, day);
      
      // Skip Sundays
      if (classDate.getDay() === 0) continue;

      // Create 2-3 classes per day
      const classesPerDay = day % 7 === 6 ? 1 : (day % 2 === 0 ? 3 : 2);
      
      for (let i = 0; i < classesPerDay; i++) {
        const template = classTemplates[i % classTemplates.length];
        const startHour = 16 + (i * 2); // 4pm, 6pm, 8pm
        const startTime = addHours(classDate, startHour);
        const endTime = addHours(startTime, template.duration);

        const newClass = await prisma.class.create({
          data: {
            academyId: academy.id,
            branchId: branch.id,
            coachId: coach.id,
            title: template.title,
            description: `Clase de ${template.title} - Nivel ${template.level}`,
            discipline: template.discipline,
            level: template.level,
            startTime,
            endTime,
            maxCapacity: 20,
            status: day < 0 ? 'COMPLETED' : (day === 0 ? 'IN_PROGRESS' : 'SCHEDULED'),
          }
        });
        classes.push(newClass);
      }
    }
    console.log(`✅ Created ${classes.length} classes\n`);

    // Create enrollments for students
    console.log('📝 Creating enrollments...');
    let enrollmentCount = 0;
    
    for (const student of students) {
      // Enroll each student in 5-10 random future classes
      const numEnrollments = 5 + Math.floor(Math.random() * 6);
      const futureClasses = classes.filter(c => c.startTime > new Date());
      const shuffled = futureClasses.sort(() => 0.5 - Math.random());
      const selectedClasses = shuffled.slice(0, numEnrollments);

      for (const cls of selectedClasses) {
        try {
          await prisma.enrollment.create({
            data: {
              userId: student.id,
              classId: cls.id,
              status: 'ENROLLED',
            }
          });
          enrollmentCount++;
        } catch (error) {
          // Skip if already enrolled
        }
      }
    }
    console.log(`✅ Created ${enrollmentCount} enrollments\n`);

    // Create historical attendance records
    console.log('✅ Creating attendance records...');
    let attendanceCount = 0;

    // Create past classes for attendance history
    const pastClasses = [];
    for (let day = 1; day <= 90; day++) {
      const classDate = subDays(today, day);
      
      // Skip Sundays
      if (classDate.getDay() === 0) continue;

      // 2 classes per day in the past
      for (let i = 0; i < 2; i++) {
        const template = classTemplates[i % classTemplates.length];
        const startHour = 18 + (i * 2);
        const startTime = addHours(classDate, startHour);
        const endTime = addHours(startTime, template.duration);

        const pastClass = await prisma.class.create({
          data: {
            academyId: academy.id,
            branchId: branch.id,
            coachId: coach.id,
            title: template.title,
            description: `Clase de ${template.title}`,
            discipline: template.discipline,
            level: template.level,
            startTime,
            endTime,
            maxCapacity: 20,
            status: 'COMPLETED',
          }
        });
        pastClasses.push(pastClass);
      }
    }

    // Create attendance for past classes
    for (const student of students) {
      // Each student attends 60-80% of past classes
      const attendanceRate = 0.6 + (Math.random() * 0.2);
      
      for (const cls of pastClasses) {
        if (Math.random() < attendanceRate) {
          const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          try {
            await prisma.attendance.create({
              data: {
                userId: student.id,
                classId: cls.id,
                status,
                checkedInAt: status !== 'ABSENT' ? cls.startTime : null,
              }
            });
            attendanceCount++;
          } catch (error) {
            // Skip duplicates
          }
        }
      }
    }
    console.log(`✅ Created ${attendanceCount} attendance records\n`);

    // Create curriculum if it doesn't exist
    console.log('📚 Creating curriculum...');
    let curriculum = await prisma.curriculum.findFirst({
      where: { academyId: academy.id }
    });

    if (!curriculum) {
      curriculum = await prisma.curriculum.create({
        data: {
          academyId: academy.id,
          name: 'Karate Tradicional',
          description: 'Programa completo de Karate desde cinturón blanco hasta negro',
          discipline: 'Karate',
          level: 'Todos',
          order: 1,
        }
      });
      console.log(`✅ Created curriculum: ${curriculum.name}`);

      // Create modules
      const modules = [
        { name: 'Fundamentos', description: 'Bases del Karate', order: 1 },
        { name: 'Katas Básicos', description: 'Katas para principiantes', order: 2 },
        { name: 'Kumite', description: 'Combate y aplicación', order: 3 },
      ];

      for (const moduleData of modules) {
        const module = await prisma.module.create({
          data: {
            curriculumId: curriculum.id,
            ...moduleData,
          }
        });

        // Create units for each module
        const units = [
          { name: 'Posiciones', description: 'Posiciones básicas', order: 1 },
          { name: 'Bloqueos', description: 'Técnicas de defensa', order: 2 },
          { name: 'Golpes', description: 'Técnicas de ataque', order: 3 },
        ];

        for (const unitData of units) {
          const unit = await prisma.unit.create({
            data: {
              moduleId: module.id,
              ...unitData,
            }
          });

          // Create techniques for each unit
          const techniques = [
            { name: 'Técnica 1', description: 'Primera técnica', order: 1 },
            { name: 'Técnica 2', description: 'Segunda técnica', order: 2 },
            { name: 'Técnica 3', description: 'Tercera técnica', order: 3 },
          ];

          for (const techData of techniques) {
            await prisma.technique.create({
              data: {
                unitId: unit.id,
                ...techData,
                prerequisites: [],
                tags: [moduleData.name, unitData.name],
              }
            });
          }
        }
      }
      console.log(`✅ Created curriculum structure with modules, units, and techniques\n`);
    } else {
      console.log(`✅ Curriculum already exists: ${curriculum.name}\n`);
    }

    // Create some progress for students
    console.log('📈 Creating student progress...');
    const techniques = await prisma.technique.findMany({
      take: 10
    });

    let progressCount = 0;
    for (const student of students.slice(0, 5)) {
      // Each student completes 3-7 techniques
      const numCompleted = 3 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < numCompleted && i < techniques.length; i++) {
        try {
          await prisma.studentProgress.create({
            data: {
              studentId: student.id,
              techniqueId: techniques[i].id,
              completed: true,
              score: 70 + Math.floor(Math.random() * 30), // 70-100
              notes: 'Completado satisfactoriamente',
              completedAt: subDays(new Date(), Math.floor(Math.random() * 30)),
            }
          });
          progressCount++;
        } catch (error) {
          // Skip duplicates
        }
      }
    }
    console.log(`✅ Created ${progressCount} progress records\n`);

    // Summary
    console.log('🎉 Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Classes: ${classes.length + pastClasses.length}`);
    console.log(`  - Enrollments: ${enrollmentCount}`);
    console.log(`  - Attendance records: ${attendanceCount}`);
    console.log(`  - Curriculum items: ${techniques.length}`);
    console.log(`  - Student progress: ${progressCount}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedStudentData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
