import { PrismaClient, PaymentStatus, PaymentType, MembershipStatus } from '@prisma/client'

const prisma = new PrismaClient()

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  // Handle month overflow (e.g., 31st to shorter months)
  if (d.getDate() < day) d.setDate(0)
  return d
}

async function main() {
  const academySlug = 'global-jiu-jitsu'
  const DEFAULT_AMOUNT = 50000
  const partialNames = new Map<string, number>([
    ['Max Bottiger', 40000],
    ['Tomas', 40000],
    ['Jose Tomas Ovalle', 40000],
  ])

  const academy = await prisma.academy.findUnique({ where: { slug: academySlug } })
  if (!academy) throw new Error(`Academy not found: ${academySlug}`)

  const memberships = await prisma.membership.findMany({
    where: {
      academyId: academy.id,
      status: MembershipStatus.ACTIVE,
      NOT: { nextBillingDate: null },
    },
    include: {
      user: { select: { id: true, name: true } },
      payments: {
        select: { id: true, status: true, paidAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  for (const m of memberships) {
    const userName = m.user?.name || 'Desconocido'
    const nextBilling = m.nextBillingDate as Date
    const supposedPaidAt = addMonths(nextBilling, -1)

    // Skip if a PAID payment already exists recently (avoid duplicates)
    const hasRecentPaid = m.payments.some((p) => p.status === 'PAID' && p.paidAt && Math.abs((p.paidAt.getTime() - supposedPaidAt.getTime()) / (1000*60*60*24)) <= 10)
    if (hasRecentPaid) {
      console.log(`Skip ${userName}: already has PAID near ${supposedPaidAt.toISOString().slice(0,10)}`)
      continue
    }

    // Determine amount (partial or default)
    const amount = partialNames.get(userName) ?? DEFAULT_AMOUNT

    await prisma.payment.create({
      data: {
        academyId: academy.id,
        membershipId: m.id,
        userId: m.userId,
        amount,
        currency: 'CLP',
        status: PaymentStatus.PAID,
        type: PaymentType.SUBSCRIPTION,
        paidAt: supposedPaidAt,
      },
    })

    console.log(`Created PAID for ${userName}: ${amount} CLP on ${supposedPaidAt.toISOString().slice(0,10)}`)
  }

  console.log('✅ Backfill complete.')
}

main().catch(async (e) => {
  console.error('❌ Error:', e)
  await prisma.$disconnect()
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
