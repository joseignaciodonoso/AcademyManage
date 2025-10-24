import { PrismaClient, PaymentStatus, PaymentType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const academySlug = 'global-jiu-jitsu'
  const names = ['Max Bottiger', 'Tomas', 'Jose Tomas Ovalle']
  const amount = 40000

  const academy = await prisma.academy.findUnique({ where: { slug: academySlug } })
  if (!academy) throw new Error(`Academy not found: ${academySlug}`)

  for (const name of names) {
    const user = await prisma.user.findFirst({ where: { academyId: academy.id, name } })
    if (!user) {
      console.warn(`User not found: ${name}`)
      continue
    }

    const membership = await prisma.membership.findFirst({ where: { academyId: academy.id, userId: user.id } })
    if (!membership) {
      console.warn(`Membership not found for: ${name}`)
      continue
    }

    const payment = await prisma.payment.create({
      data: {
        academyId: academy.id,
        membershipId: membership.id,
        userId: user.id,
        amount,
        currency: 'CLP',
        status: PaymentStatus.PAID,
        type: PaymentType.SUBSCRIPTION,
        paidAt: new Date(),
      },
    })

    console.log(`Registered partial payment: ${name} -> ${amount} CLP (paymentId=${payment.id})`)
  }

  console.log('✅ Partial payments registered.')
}

main().catch(async (e) => {
  console.error('❌ Error:', e)
  await prisma.$disconnect()
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
