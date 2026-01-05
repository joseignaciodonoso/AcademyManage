import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Completing Global Jiu Jitsu academy demo data...")

  // Find existing academy
  let academy = await prisma.academy.findUnique({
    where: { slug: "global-jiu-jitsu" }
  })

  if (!academy) {
    academy = await prisma.academy.create({
    data: {
      name: "Global Jiu Jitsu",
      slug: "global-jiu-jitsu",
      type: "ACADEMY",
      discipline: "Jiu-Jitsu",
      brandPrimary: "#1e40af",
      brandSecondary: "#3b82f6",
      brandAccent: "#60a5fa",
      currency: "CLP",
      timezone: "America/Santiago",
      onboardingCompleted: true,
      transferEnabled: true,
      bankName: "Banco de Chile",
      bankAccountType: "Cuenta Corriente",
      bankAccountNumber: "123456789",
      bankAccountHolder: "Global Jiu Jitsu SpA",
      bankAccountRut: "76.123.456-7",
      bankAccountEmail: "pagos@globaljj.cl",
    },
  })

  console.log(`Academy created: ${academy.name} (${academy.slug})`)

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.create({
    data: {
      email: "admin@globaljj.cl",
      name: "Admin Global JJ",
      password: hashedPassword,
      role: "ACADEMY_ADMIN",
      academyId: academy.id,
    },
  })
  console.log(`Admin user created: ${admin.email}`)

  // Create student user
  const studentPassword = await bcrypt.hash("student123", 10)
  const student = await prisma.user.create({
    data: {
      email: "alumno@globaljj.cl",
      name: "Alumno Demo",
      password: studentPassword,
      role: "STUDENT",
      academyId: academy.id,
    },
  })
  console.log(`Student user created: ${student.email}`)

  // Create plans
  const basicPlan = await prisma.plan.create({
    data: {
      academyId: academy.id,
      name: "Plan Básico",
      slug: "basico",
      price: 35000,
      currency: "CLP",
      type: "MONTHLY",
      classesPerMonth: 8,
      unlimitedClasses: false,
      status: "ACTIVE",
    },
  })

  const fullPlan = await prisma.plan.create({
    data: {
      academyId: academy.id,
      name: "Plan Full",
      slug: "full",
      price: 55000,
      currency: "CLP",
      type: "MONTHLY",
      classesPerMonth: null,
      unlimitedClasses: true,
      status: "ACTIVE",
      recommended: true,
    },
  })

  console.log(`Plans created: ${basicPlan.name}, ${fullPlan.name}`)

  // Create active membership for student
  const membership = await prisma.membership.create({
    data: {
      academyId: academy.id,
      userId: student.id,
      planId: fullPlan.id,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })
  console.log(`Membership created for student: ${membership.status}`)

  // Create a class schedule
  const classSchedule = await prisma.classSchedule.create({
    data: {
      academyId: academy.id,
      name: "Jiu-Jitsu Fundamentals",
      dayOfWeek: 1, // Monday
      startTime: "19:00",
      endTime: "20:30",
      maxCapacity: 20,
    },
  })
  console.log(`Class schedule created: ${classSchedule.name}`)

  console.log("\n✅ Demo data created successfully!")
  console.log("\nCredentials:")
  console.log("  Admin: admin@globaljj.cl / admin123")
  console.log("  Student: alumno@globaljj.cl / student123")
  console.log(`\nAccess: http://localhost:3001/global-jiu-jitsu/login`)
}

main()
  .catch((e) => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
