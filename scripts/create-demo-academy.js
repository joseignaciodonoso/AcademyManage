// Script to create a demo academy for test users
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDemoAcademy() {
  try {
    // Check if academy already exists
    const existingAcademy = await prisma.academy.findUnique({
      where: { id: 'academy-demo-123' }
    });

    if (existingAcademy) {
      console.log('Demo academy already exists:', existingAcademy.name);
      return;
    }

    // Create the demo academy
    const academy = await prisma.academy.create({
      data: {
        id: 'academy-demo-123',
        name: 'Academia Demo',
        slug: 'academia-demo',
        currency: 'CLP',
        timezone: 'America/Santiago',
        dateFormat: 'DD/MM/YYYY',
        taxRate: 0.19,
        useUf: false,
        onboardingCompleted: true,
        brandPrimary: '#1e40af',
        brandSecondary: '#6366f1',
        brandAccent: '#3b82f6',
        brandNeutral: '#f1f5f9',
        brandBackground: '#ffffff',
        brandForeground: '#0f172a',
        defaultThemeMode: 'system'
      }
    });

    console.log('Demo academy created successfully:');
    console.log({
      id: academy.id,
      name: academy.name,
      slug: academy.slug,
      currency: academy.currency
    });
    
  } catch (error) {
    console.error('Error creating demo academy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoAcademy();
