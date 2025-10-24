import { PrismaClient, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const academySlug = 'global-jiu-jitsu'

  const academy = await prisma.academy.findUnique({ where: { slug: academySlug } })
  if (!academy) throw new Error(`Academy not found: ${academySlug}`)

  // Students marked as PAST_DUE without explicit "Paga este mes" note
  const namesToCleanup = [
    'Agustin',
    'Claudio Gonzalez',
  ]

  const users = await prisma.user.findMany({
    where: {
      academyId: academy.id,
      name: { in: namesToCleanup },
    },
    select: { id: true, name: true },
  })

  for (const u of users) {
    // Find memberships
    const memberships = await prisma.membership.findMany({
      where: { userId: u.id, academyId: academy.id },
      select: { id: true },
    })

    for (const m of memberships) {
      const deleted = await prisma.payment.deleteMany({
        where: {
          academyId: academy.id,
          membershipId: m.id,
          status: PaymentStatus.PENDING,
        },
      })
      console.log(`User ${u.name}: removed ${deleted.count} pending payments`)
    }
  }

  console.log('✅ Cleanup done.')
}

main().catch(async (e) => {
  console.error('❌ Error:', e)
  await prisma.$disconnect()
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
