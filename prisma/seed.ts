import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Orgs demo
  const demoAcademy = await prisma.organization.upsert({
    where: { slug: "demoacademy" },
    update: {},
    create: {
      name: "Demo Academy",
      slug: "demoacademy",
      type: "ACADEMY",
      settings: {
        create: { currency: "CLP", timezone: "America/Santiago", taxRate: 0.19, themeMode: "system" },
      },
    },
  })

  const demoClub = await prisma.organization.upsert({
    where: { slug: "democlub" },
    update: {},
    create: {
      name: "Demo Club",
      slug: "democlub",
      type: "CLUB",
      settings: {
        create: { currency: "CLP", timezone: "America/Santiago", taxRate: 0.19, themeMode: "system" },
      },
    },
  })

  // Admin users for each org (idempotent)
  const passwordHash = await bcrypt.hash("admin123", 10)

  const academyAdmin = await prisma.user.upsert({
    where: { email: "admin@demoacademy.local" },
    update: {},
    create: {
      email: "admin@demoacademy.local",
      name: "Academy Admin",
      role: "ACADEMY_ADMIN",
      password: passwordHash,
      orgId: demoAcademy.id,
    },
  })

  const clubAdmin = await prisma.user.upsert({
    where: { email: "admin@democlub.local" },
    update: {},
    create: {
      email: "admin@democlub.local",
      name: "Club Admin",
      role: "ACADEMY_ADMIN", // will be specialized later as CLUB_ADMIN in auth matrix
      password: passwordHash,
      orgId: demoClub.id,
    },
  })

  // Organization members
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: demoAcademy.id, userId: academyAdmin.id } },
    update: {},
    create: { organizationId: demoAcademy.id, userId: academyAdmin.id, role: "ACADEMY_ADMIN" },
  })

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: demoClub.id, userId: clubAdmin.id } },
    update: {},
    create: { organizationId: demoClub.id, userId: clubAdmin.id, role: "ACADEMY_ADMIN" },
  })

  console.log("Seeded organizations:", { demoAcademy: demoAcademy.slug, demoClub: demoClub.slug })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
