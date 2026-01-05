import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Completing Global Jiu Jitsu academy demo data...")

  // Find existing academy
  const academy = await prisma.academy.findUnique({
    where: { slug: "global-jiu-jitsu" }
  })

  if (!academy) {
    console.error("Academy not found. Please create it first.")
    return
  }

  console.log(`Found academy: ${academy.name} (${academy.id})`)

  // Check if plans exist
  const existingPlans = await prisma.plan.findMany({
    where: { academyId: academy.id }
  })

  if (existingPlans.length === 0) {
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
      },
    })

    console.log(`Plans created: ${basicPlan.name}, ${fullPlan.name}`)
  } else {
    console.log(`Plans already exist: ${existingPlans.map(p => p.name).join(", ")}`)
  }

  // Get full plan for membership
  const fullPlan = await prisma.plan.findFirst({
    where: { academyId: academy.id, slug: "full" }
  })

  // Check if student has membership
  const student = await prisma.user.findFirst({
    where: { email: "alumno@globaljj.cl" }
  })

  if (student && fullPlan) {
    const existingMembership = await prisma.membership.findFirst({
      where: { userId: student.id }
    })

    if (!existingMembership) {
      const membership = await prisma.membership.create({
        data: {
          academyId: academy.id,
          userId: student.id,
          planId: fullPlan.id,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
      console.log(`Membership created for student: ${membership.status}`)
    } else {
      console.log(`Student already has membership: ${existingMembership.status}`)
    }
  }

  // Check if class schedule exists
  const existingSchedule = await prisma.classSchedule.findFirst({
    where: { academyId: academy.id }
  })

  if (!existingSchedule) {
    const classSchedule = await prisma.classSchedule.create({
      data: {
        academyId: academy.id,
        name: "Jiu-Jitsu Fundamentals",
        dayOfWeek: 1,
        startTime: "19:00",
        endTime: "20:30",
        maxCapacity: 20,
      },
    })
    console.log(`Class schedule created: ${classSchedule.name}`)
  } else {
    console.log(`Class schedule already exists: ${existingSchedule.name}`)
  }

  console.log("\n✅ Demo data completed!")
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
